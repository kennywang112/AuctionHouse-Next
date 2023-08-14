const TOKEN_AUTH_RULES_ID = new PublicKey('auth9SigNpDKz4sJJ1DfCTuZrZNSAgh9sFD3rboVmgg');

export const getMetadataAccount = (mint: PublicKey): PublicKey => (
  PublicKey.findProgramAddressSync(
    [Buffer.from('metadata', 'utf8'), TOKEN_METADATA_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    TOKEN_METADATA_PROGRAM_ID
  )[0]
)

export const getMasterEditionAccount = (mint: PublicKey): PublicKey => (
  PublicKey.findProgramAddressSync(
    [
      Buffer.from('metadata', 'utf8'),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
      Buffer.from('edition', 'utf8'),
    ],
    TOKEN_METADATA_PROGRAM_ID
  )[0]
)

export function findTokenRecordPdas(mint: PublicKey, token: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from('metadata'),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
      Buffer.from('token_record'),
      token.toBuffer(),
    ],
    TOKEN_METADATA_PROGRAM_ID
  )[0];
}

export function findDelegateRecordPdas(
  collectionMint: PublicKey,
  payer: PublicKey,
  delegate: PublicKey
): PublicKey {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from('metadata'),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      collectionMint.toBuffer(),
      Buffer.from('programmable_config_delegate'),
      payer.toBuffer(),
      delegate.toBuffer(),
    ],
    TOKEN_METADATA_PROGRAM_ID
  )[0];
}


interface PNFTAccounts {
  metadataProgram: AccountMeta;
  delegateRecord: AccountMeta;
  tokenRecord: AccountMeta;
  tokenMint: AccountMeta;
  edition: AccountMeta;
  authRulesProgram: AccountMeta;
  authRules: AccountMeta;
  sysvarInstructions: AccountMeta;
  programAsSigner: AccountMeta;
  systemProgram: AccountMeta;
  sellerTokenRecord: AccountMeta;
}

export const getPNFTAccounts = async (
  connection: Connection,
  wallet: PublicKey,
  programAsSigner: PublicKey,
  mint: PublicKey,
  seller?: PublicKey
): Promise<PNFTAccounts> => {
  const metadata = await Metadata.fromAccountAddress(connection, getMetadataAccount(mint));
  const ata = getAssociatedTokenAddressSync(mint, wallet);
  const tokenRecord = findTokenRecordPdas(mint, ata);
  const masterEdition = getMasterEditionAccount(mint);
  const authRules = metadata.programmableConfig?.ruleSet;
  const pasAssociatedTokenAccount = getAssociatedTokenAddressSync(mint, programAsSigner, true);
  const delegateRecord = findTokenRecordPdas(mint, pasAssociatedTokenAccount);
  let sellerTokenRecord = TOKEN_METADATA_PROGRAM_ID;

  if (seller) {
    const sellerATA = getAssociatedTokenAddressSync(mint, seller);
    sellerTokenRecord = findTokenRecordPdas(mint, sellerATA);
  }

  return {
    metadataProgram: {
      isSigner: false,
      isWritable: false,
      pubkey: TOKEN_METADATA_PROGRAM_ID,
    },
    delegateRecord: {
      isSigner: false,
      isWritable: true,
      pubkey: delegateRecord ?? tokenRecord,
    },
    tokenRecord: {
      isSigner: false,
      isWritable: true,
      pubkey: tokenRecord,
    },
    tokenMint: {
      isSigner: false,
      isWritable: false,
      pubkey: mint,
    },
    edition: {
      isSigner: false,
      isWritable: false,
      pubkey: masterEdition,
    },
    authRulesProgram: {
      isSigner: false,
      isWritable: false,
      pubkey: TOKEN_AUTH_RULES_ID,
    },
    authRules: {
      isSigner: false,
      isWritable: false,
      pubkey: authRules ?? TOKEN_METADATA_PROGRAM_ID,
    },
    sysvarInstructions: {
      isSigner: false,
      isWritable: false,
      pubkey: SYSVAR_INSTRUCTIONS_PUBKEY,
    },
    programAsSigner: {
      isSigner: false,
      isWritable: false,
      pubkey: programAsSigner,
    },
    systemProgram: {
      isSigner: false,
      isWritable: false,
      pubkey: SystemProgram.programId,
    },
    sellerTokenRecord: {
      isSigner: false,
      isWritable: true,
      pubkey: sellerTokenRecord,
    },
  };
};
    const accs = await getPNFTAccounts(connection, seller, programAsSigner, mintAccount);

const remainingAccounts: SellRemainingAccountsInstructionAccounts = {
    metadataProgram: accs.metadataProgram.pubkey,
    delegateRecord: accs.delegateRecord.pubkey,
    tokenRecord: accs.tokenRecord.pubkey,
    tokenMint: mintAccount,
    edition: accs.edition.pubkey,
    authRulesProgram: accs.authRulesProgram.pubkey,
    authRules: metadataParsed.programmableConfig?.ruleSet
      ? metadataParsed.programmableConfig.ruleSet
      : TOKEN_METADATA_PROGRAM_ID,
    sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY
  }
    