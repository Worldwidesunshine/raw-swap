"use client";

import { JITO_TIP_ACCOUNTS, type BuildResponse } from "@rawswap/shared";
import {
  type AddressLookupTableAccount,
  type Connection,
  PublicKey,
  SystemInstruction,
  SystemProgram,
  TransactionMessage,
  type TransactionInstruction,
  type VersionedTransaction,
} from "@solana/web3.js";

const JITO_TIP_ACCOUNT_SET = new Set(JITO_TIP_ACCOUNTS);

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

async function sha256Base64(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new Uint8Array(bytes).buffer as ArrayBuffer,
  );
  return bytesToBase64(new Uint8Array(digest));
}

async function resolveLookupTables(
  tx: VersionedTransaction,
  connection: Connection,
): Promise<AddressLookupTableAccount[]> {
  if (!("addressTableLookups" in tx.message) || tx.message.addressTableLookups.length === 0) {
    return [];
  }

  const tables = await Promise.all(
    tx.message.addressTableLookups.map(async (lookup) => {
      const account = await connection.getAddressLookupTable(lookup.accountKey, {
        commitment: "confirmed",
      });
      if (!account.value) {
        throw new Error("The route referenced a missing address lookup table.");
      }
      return account.value;
    }),
  );

  for (const lookup of tx.message.addressTableLookups) {
    const table = tables.find((candidate) => candidate.key.equals(lookup.accountKey));
    if (!table) {
      throw new Error("The route referenced an unresolved address lookup table.");
    }
    for (const index of [...lookup.writableIndexes, ...lookup.readonlyIndexes]) {
      if (!table.state.addresses[index]) {
        throw new Error("The route referenced an invalid address lookup table index.");
      }
    }
  }

  return tables;
}

function getPayerToJitoTransfers(
  instructions: readonly TransactionInstruction[],
  payer: PublicKey,
) {
  return instructions.flatMap((instruction) => {
    if (!instruction.programId.equals(SystemProgram.programId)) {
      return [];
    }

    try {
      if (SystemInstruction.decodeInstructionType(instruction) !== "Transfer") {
        return [];
      }
      const decoded = SystemInstruction.decodeTransfer(instruction);
      if (!decoded.fromPubkey.equals(payer)) {
        return [];
      }
      if (!JITO_TIP_ACCOUNT_SET.has(decoded.toPubkey.toBase58())) {
        return [];
      }
      return [decoded];
    } catch {
      return [];
    }
  });
}

export async function assertBuildTransactionSafe(args: {
  build: BuildResponse;
  connection: Connection;
  tx: VersionedTransaction;
  walletPublicKey: PublicKey;
}) {
  const { build, connection, tx, walletPublicKey } = args;
  const payer = tx.message.staticAccountKeys[0];
  if (!payer || !payer.equals(walletPublicKey)) {
    throw new Error("The unsigned transaction payer does not match the connected wallet.");
  }

  if (tx.message.header.numRequiredSignatures !== 1) {
    throw new Error("The unsigned transaction requested unexpected additional signatures.");
  }

  if (tx.signatures.some((signature) => signature.some((byte) => byte !== 0))) {
    throw new Error("The unsigned transaction already contained a signature.");
  }

  if (tx.message.recentBlockhash !== build.recentBlockhash) {
    throw new Error("The unsigned transaction blockhash did not match the reviewed build.");
  }

  const messageHash = await sha256Base64(tx.message.serialize());
  if (messageHash !== build.transactionMessageHash) {
    throw new Error("The unsigned transaction bytes did not match the reviewed build.");
  }

  const lookupTables = await resolveLookupTables(tx, connection);
  const decompiled = TransactionMessage.decompile(tx.message, {
    addressLookupTableAccounts: lookupTables,
  });
  const jitoTransfers = getPayerToJitoTransfers(decompiled.instructions, walletPublicKey);

  if (build.estimatedJitoTipLamports > 0) {
    const lastInstruction = decompiled.instructions.at(-1);
    if (!lastInstruction || !lastInstruction.programId.equals(SystemProgram.programId)) {
      throw new Error("The reviewed build was missing the expected Jito tip instruction.");
    }
    if (SystemInstruction.decodeInstructionType(lastInstruction) !== "Transfer") {
      throw new Error("The reviewed build was missing the expected Jito tip transfer.");
    }

    const decoded = SystemInstruction.decodeTransfer(lastInstruction);
    if (!decoded.fromPubkey.equals(walletPublicKey)) {
      throw new Error("The Jito tip transfer did not debit the connected wallet.");
    }
    if (!JITO_TIP_ACCOUNT_SET.has(decoded.toPubkey.toBase58())) {
      throw new Error("The Jito tip recipient was not in the approved Jito account set.");
    }
    if (decoded.lamports !== BigInt(build.estimatedJitoTipLamports)) {
      throw new Error("The Jito tip amount did not match the reviewed build.");
    }
  } else if (jitoTransfers.length > 0) {
    throw new Error("The unsigned transaction included an unexpected Jito tip transfer.");
  }
}
