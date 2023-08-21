
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Keypair ,clusterApiUrl } from "@solana/web3.js";
import { 
    Connection, 
    Transaction,
    SystemProgram, 
    SYSVAR_INSTRUCTIONS_PUBKEY,
    SYSVAR_RENT_PUBKEY, 
    ComputeBudgetProgram 
} from '@solana/web3.js';
import { 
  createSellRemainingAccountsInstruction, 
  PROGRAM_ADDRESS, 
  createExecuteSaleRemainingAccountsInstruction, 
  createSellInstruction, 
  createCancelRemainingAccountsInstruction, 
  createExecuteSaleInstruction, 
  createPrintBidReceiptInstruction,
  createBuyInstruction,
  createPrintListingReceiptInstruction,
  createPrintPurchaseReceiptInstruction,
  createCancelBidReceiptInstruction,
  createCancelListingReceiptInstruction
  } from "@metaplex-foundation/mpl-auction-house";
import bs58 from "bs58";
import { getAssociatedTokenAddressSync, getAccount ,getMint, NATIVE_MINT } from "@solana/spl-token";
import { BN } from "@project-serum/anchor"

let TOKEN_METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s')
let TOKEN_AUTH_RULES_ID = new PublicKey('auth9SigNpDKz4sJJ1DfCTuZrZNSAgh9sFD3rboVmgg');
let AUTH_RULES = new PublicKey("eBJLFYPxJmMGKuFwpDWkzxZeUrad92kZRC5BJLpzyT9")
let Auction_House = new PublicKey("DYJGVipuxyXpJoPqzFLq44e5xJWRzao6qu12TTioAMWq")

let [signer, signerBump] = PublicKey.findProgramAddressSync(
[Buffer.from('auction_house'), Buffer.from('signer')],
new PublicKey(PROGRAM_ADDRESS),
);

function getAuctionHouseTradeState( 
    auctionHouse, 
    wallet, 
    tokenAccount, 
    treasuryMint, 
    tokenMint, 
    tokenSize, 
    buyPrice 
  ) { 
    return PublicKey.findProgramAddressSync( 
      [ 
        Buffer.from('auction_house'), 
        wallet.toBuffer(), 
        auctionHouse.toBuffer(), 
        tokenAccount.toBuffer(), 
        treasuryMint.toBuffer(), 
        tokenMint.toBuffer(), 
        new BN(buyPrice).toArrayLike(Buffer, "le", 8), 
        new BN(tokenSize).toArrayLike(Buffer, "le", 8), 
      ], 
      new PublicKey(PROGRAM_ADDRESS) 
); 
}

export const List = async (mindId, wallet, metaplex, list_price) => {
    
    const auctionHouse = await metaplex
    .auctionHouse()
    .findByAddress({ address: Auction_House });

    const masterEdition = PublicKey.findProgramAddressSync(
        [
          Buffer.from('metadata'),
          TOKEN_METADATA_PROGRAM_ID.toBuffer(),
          mindId.toBuffer(),
          Buffer.from('edition'),
        ],
        TOKEN_METADATA_PROGRAM_ID
      )[0];
    const [metadata,metadata_bump] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('metadata'),
          TOKEN_METADATA_PROGRAM_ID.toBuffer(),
          mindId.toBuffer(),
        ],
        TOKEN_METADATA_PROGRAM_ID,
      );

    const associatedAddress = getAssociatedTokenAddressSync(mindId, wallet.publicKey);
    const tokenRecord = PublicKey.findProgramAddressSync(
    [
        Buffer.from('metadata'),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mindId.toBuffer(),
        Buffer.from('token_record'),
        associatedAddress.toBuffer(),
    ],
    TOKEN_METADATA_PROGRAM_ID
    )[0];
    const delegateRecord = PublicKey.findProgramAddressSync(
    [
        Buffer.from('metadata'),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mindId.toBuffer(),
        Buffer.from('delegate_record'),
        associatedAddress.toBuffer(),
    ],
    TOKEN_METADATA_PROGRAM_ID
    )[0];

    const [sellerTradeState, tradeBump] = getAuctionHouseTradeState(
        auctionHouse.address,
        wallet.publicKey,
        associatedAddress,
        NATIVE_MINT,
        mindId,
        1,
        list_price,
    );

    const [freeTradeState, freeTradeBump] = await getAuctionHouseTradeState(
        auctionHouse.address,
        wallet.publicKey,
        associatedAddress,
        NATIVE_MINT,
        mindId,
        1,
        '0',
    );

    const remain_ix = createSellRemainingAccountsInstruction(
    {
        metadataProgram: TOKEN_METADATA_PROGRAM_ID,
        delegateRecord: delegateRecord,
        tokenRecord: tokenRecord,
        tokenMint: mindId,
        edition: masterEdition,
        authRulesProgram: TOKEN_AUTH_RULES_ID,
        authRules: AUTH_RULES,
        sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY,
    }
    )

    const accounts = {
        wallet: wallet.publicKey,
        tokenAccount: associatedAddress,
        metadata: metadata,
        authority: auctionHouse.authorityAddress,
        auctionHouse: auctionHouse.address,
        auctionHouseFeeAccount: auctionHouse.feeAccountAddress,
        sellerTradeState: sellerTradeState,
        freeSellerTradeState: freeTradeState,
        systemProgram: SystemProgram.programId,
        programAsSigner: signer,
        rent: SYSVAR_RENT_PUBKEY,
        anchorRemainingAccounts: remain_ix.keys
    }

    const args = {
        tradeStateBump: tradeBump,
        freeTradeStateBump: freeTradeBump,
        programAsSignerBump: signerBump,
        buyerPrice: new BN(list_price),
        tokenSize: new BN(Math.ceil(1 * 1))
    }

    const sellInstruction = createSellInstruction(accounts,args)

    sellInstruction.keys[2].isWritable = true

    return sellInstruction
}

export const Bid = async (mindId, wallet, metaplex, seller, bid_price) => {

    const auctionHouse = await metaplex
    .auctionHouse()
    .findByAddress({ address: Auction_House });

    const [metadata,metadata_bump] = PublicKey.findProgramAddressSync(
    [
        Buffer.from('metadata'),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mindId.toBuffer(),
    ],
    TOKEN_METADATA_PROGRAM_ID,
    );

    const associatedAddress = getAssociatedTokenAddressSync(mindId, seller);

    const escrowPaymentAccount = PublicKey.findProgramAddressSync(
        [
            Buffer.from('auction_house'),
            (await auctionHouse).address.toBuffer(),
            wallet.publicKey.toBuffer(),
        ],
        new PublicKey(PROGRAM_ADDRESS)
    )

    const buyerTradeState = getAuctionHouseTradeState(
        (await auctionHouse).address,
        wallet.publicKey,
        associatedAddress,
        NATIVE_MINT,
        mindId,
        1,
        bid_price
    )

    const bid_ix = createBuyInstruction(
    {
        wallet: wallet.publicKey,
        paymentAccount: wallet.publicKey,
        transferAuthority: wallet.publicKey,
        treasuryMint: NATIVE_MINT,
        tokenAccount: associatedAddress,
        metadata: metadata,
        escrowPaymentAccount: escrowPaymentAccount[0],
        authority: (await auctionHouse).authorityAddress,
        auctionHouse: (await auctionHouse).address,
        auctionHouseFeeAccount: (await auctionHouse).feeAccountAddress,
        buyerTradeState: buyerTradeState[0],
    },
    {
        tradeStateBump: buyerTradeState[1],
        escrowPaymentBump: escrowPaymentAccount[1],
        buyerPrice: bid_price,
        tokenSize: 1,
    }
    )

    bid_ix.keys[7].isSigner = true

    return bid_ix
}

export const Execute = async (mindId, metaplex, seller, bid_price, buyer) => {

    const auctionHouse = await metaplex
    .auctionHouse()
    .findByAddress({ address: Auction_House });

    const associatedAddress = getAssociatedTokenAddressSync(mindId, seller);
    const buyerAssociatedAccount = getAssociatedTokenAddressSync(mindId, buyer)

    const masterEdition = PublicKey.findProgramAddressSync(
        [
          Buffer.from('metadata'),
          TOKEN_METADATA_PROGRAM_ID.toBuffer(),
          mindId.toBuffer(),
          Buffer.from('edition'),
        ],
        TOKEN_METADATA_PROGRAM_ID
      )[0];
    
    const [metadata,metadata_bump] = PublicKey.findProgramAddressSync(
    [
        Buffer.from('metadata'),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mindId.toBuffer(),
    ],
    TOKEN_METADATA_PROGRAM_ID,
    );

    const buyerTradeState = getAuctionHouseTradeState(
        (await auctionHouse).address,
        buyer,
        associatedAddress,
        NATIVE_MINT,
        mindId,
        1,
        bid_price
    )
    
    const sellerTradeState = getAuctionHouseTradeState( 
        (await auctionHouse).address, 
        seller, 
        associatedAddress, 
        NATIVE_MINT, 
        mindId, 
        1,
        bid_price
    );

    const nft = await metaplex.nfts().findByToken({token: associatedAddress})
    const creators = [
    {
        pubkey: nft.creators[0].address,
        isWritable: true,
        isSigner: false
    },
    {
        pubkey: nft.creators[1].address,
        isWritable: true,
        isSigner: false
    }
    ]

    const owner_tokenRecord = PublicKey.findProgramAddressSync(
    [
        Buffer.from('metadata'),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mindId.toBuffer(),
        Buffer.from('token_record'),
        associatedAddress.toBuffer(),
    ],
    TOKEN_METADATA_PROGRAM_ID
    )[0];
    const des_tokenRecord = PublicKey.findProgramAddressSync(
    [
        Buffer.from('metadata'),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mindId.toBuffer(),
        Buffer.from('token_record'),
        buyerAssociatedAccount.toBuffer(),
    ],
    TOKEN_METADATA_PROGRAM_ID
    )[0];
  
    const escrowPaymentAccount = PublicKey.findProgramAddressSync(
        [
            Buffer.from('auction_house'),
            (await auctionHouse).address.toBuffer(),
            buyer.toBuffer(),
        ],
        new PublicKey(PROGRAM_ADDRESS)
    )

    const [freeTradeState, freeTradeBump] = getAuctionHouseTradeState( 
        (await auctionHouse).address, 
        seller, 
        associatedAddress, 
        NATIVE_MINT, 
        mindId, 
        1, 
        "0"
    );
  
    const execute_remain = createExecuteSaleRemainingAccountsInstruction(
    {
        metadataProgram: TOKEN_METADATA_PROGRAM_ID,
        edition: masterEdition,
        ownerTr: owner_tokenRecord,
        destinationTr: des_tokenRecord,
        authRulesProgram: TOKEN_AUTH_RULES_ID,
        authRules: AUTH_RULES,
        sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY,
    }
    )
  
    const execute_ix = createExecuteSaleInstruction(
    {
        buyer: buyer,
        seller: seller,
        tokenAccount: associatedAddress,
        tokenMint: mindId,
        metadata: metadata,
        treasuryMint: NATIVE_MINT,
        escrowPaymentAccount: escrowPaymentAccount[0],
        sellerPaymentReceiptAccount: seller,
        buyerReceiptTokenAccount: buyerAssociatedAccount,
        authority: (await auctionHouse).authorityAddress,
        auctionHouse: (await auctionHouse).address,
        auctionHouseFeeAccount: (await auctionHouse).feeAccountAddress,
        auctionHouseTreasury: (await auctionHouse).treasuryAccountAddress,
        buyerTradeState: buyerTradeState[0],
        sellerTradeState: sellerTradeState[0],
        freeTradeState: freeTradeState,
        programAsSigner: signer,
        anchorRemainingAccounts: creators
    },
    {
        escrowPaymentBump: escrowPaymentAccount[1],
        freeTradeStateBump: freeTradeBump,
        programAsSignerBump: signerBump,
        buyerPrice: bid_price,
        tokenSize: 1,
    }
    )
  
    execute_ix.keys[9].isSigner = true
    execute_ix.keys[9].isWritable = true
    execute_ix.keys[4].isWritable = true
    for(const i of execute_remain.keys){
        execute_ix.keys.push(i)
    }

    return execute_ix

}

export const Buy = async (mindId, wallet, metaplex, seller, list_price, buyer) => {

    // full bid ix add full execute ix , and to buy at a list price , change the param
    const bid_full_ix = await Bid(mindId, wallet, metaplex, seller, list_price)
    const execute_full_ix = await Execute(mindId, metaplex, seller, list_price, buyer)

    const txs = [bid_full_ix, execute_full_ix]

    return txs
}

export const Sell = async (mindId, wallet, metaplex, bid_price, buyer) => {

    // sell at a bid price ,list at bid price and execute
    const list_ix = await List(mindId, wallet, metaplex, bid_price)
    const execute_ix = await Execute(mindId, metaplex, wallet.publicKey, bid_price, buyer)

    const txs = [list_ix, execute_ix]

    return txs
}

export const cancel_list = async (mindId, wallet, metaplex, list_receipt) => {
     
    const auctionHouse = await metaplex
    .auctionHouse()
    .findByAddress({ address: Auction_House });
    const ata = getAssociatedTokenAddressSync(mindId, wallet.publicKey);
    
    const listing = await metaplex.auctionHouse().findListingByReceipt({
      auctionHouse: auctionHouse,
      receiptAddress: list_receipt
    });

    const tokenRecord = PublicKey.findProgramAddressSync(
        [
            Buffer.from('metadata'),
            TOKEN_METADATA_PROGRAM_ID.toBuffer(),
            mindId.toBuffer(),
            Buffer.from('token_record'),
            ata.toBuffer(),
        ],
        TOKEN_METADATA_PROGRAM_ID
    )[0];

    const masterEdition = PublicKey.findProgramAddressSync(
        [
            Buffer.from('metadata'),
            TOKEN_METADATA_PROGRAM_ID.toBuffer(),
            mindId.toBuffer(),
            Buffer.from('edition'),
        ],
        TOKEN_METADATA_PROGRAM_ID
    )[0];

    const dr = PublicKey.findProgramAddressSync(
        [
            Buffer.from('metadata'),
            TOKEN_METADATA_PROGRAM_ID.toBuffer(),
            mindId.toBuffer(),
            Buffer.from('delegate_record'),
            ata.toBuffer(),
        ],
        TOKEN_METADATA_PROGRAM_ID
    )[0];

    const metadata = PublicKey.findProgramAddressSync(
        [
            Buffer.from('metadata'),
            TOKEN_METADATA_PROGRAM_ID.toBuffer(),
            mindId.toBuffer(),
        ],
        TOKEN_METADATA_PROGRAM_ID
    )[0];

    const remain_ix = createCancelRemainingAccountsInstruction(
        {
            metadataProgram: TOKEN_METADATA_PROGRAM_ID,
            delegateRecord: dr,
            programAsSigner: signer,
            metadata: metadata,
            edition: masterEdition,
            tokenRecord: tokenRecord,
            tokenMint: mindId,
            authRulesProgram: TOKEN_AUTH_RULES_ID,
            authRules: AUTH_RULES,
            sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY
        }
    )

    const cancelListing_ix = metaplex
      .auctionHouse().builders().cancelListing({
          auctionHouse: auctionHouse,
          listing: listing,        
      });
    for (const i of remain_ix.keys) {
        cancelListing_ix.records[0].instruction.keys.push(i)
    }
    cancelListing_ix.records[0].instruction.keys[2].isWritable = true

    return cancelListing_ix

}

export const cancel_bid = async (mindId, metaplex) => {

    const auctionHouse = await metaplex
    .auctionHouse()
    .findByAddress({ address: Auction_House });

    const [metadata,metadata_bump] = PublicKey.findProgramAddressSync(
        [
            Buffer.from('metadata'),
            TOKEN_METADATA_PROGRAM_ID.toBuffer(),
            mindId.toBuffer(),
        ],
        TOKEN_METADATA_PROGRAM_ID,
    );

    const bid = await metaplex
    .auctionHouse()
    .findBids({ auctionHouse, metadata });

    const cancelbid_ix = await metaplex               
    .auctionHouse().builders()
    .cancelBid({
        auctionHouse,
        bid: bid,
    });

    return cancelbid_ix
}

export const Print_list_receipt = async (mindId, wallet, metaplex, list_price) => {

    const auctionHouse = await metaplex
    .auctionHouse()
    .findByAddress({ address: Auction_House });

    const ata = getAssociatedTokenAddressSync(mindId, wallet.publicKey);

    const [sellerTradeState, tradeBump] = getAuctionHouseTradeState(
        auctionHouse.address,
        wallet.publicKey,
        ata,
        NATIVE_MINT,
        mindId,
        1,
        list_price,
    );

    const [receipt, receiptBump] = PublicKey.findProgramAddressSync(
        [
            Buffer.from('listing_receipt'), 
            sellerTradeState.toBuffer()
        ], 
        new PublicKey(PROGRAM_ADDRESS)
    );

    const receipt_ix = createPrintListingReceiptInstruction(
        {
            receipt: receipt,
            bookkeeper: wallet.publicKey,
            instruction: SYSVAR_INSTRUCTIONS_PUBKEY, 
        },
        {
            receiptBump: receiptBump
        }
    )

    return receipt_ix
}

export const Print_bid_receipt = async (mindId, wallet, metaplex, seller, bid_price) => {
    
    const auctionHouse = await metaplex
    .auctionHouse()
    .findByAddress({ address: Auction_House });

    const associatedAddress = getAssociatedTokenAddressSync(mindId, seller);

    const [buyerTradeState, tradeBump] = getAuctionHouseTradeState(
        (await auctionHouse).address,
        wallet.publicKey,
        associatedAddress,
        NATIVE_MINT,
        mindId,
        1,
        bid_price
    )

    const [receipt, receiptBump] = PublicKey.findProgramAddressSync(
        [
            Buffer.from('bid_receipt'), 
            buyerTradeState.toBuffer()
        ], 
        new PublicKey(PROGRAM_ADDRESS)
    );

    const bid_ix = createPrintBidReceiptInstruction(
        {
            receipt: receipt,
            bookkeeper: wallet.publicKey,
            instruction: SYSVAR_INSTRUCTIONS_PUBKEY,
        },
        {
            receiptBump: receiptBump
        }
    )

    return bid_ix
}

export const Print_purchase_receipt = async (mindId, wallet, seller, metaplex, list_price) => {

    const auctionHouse = await metaplex
    .auctionHouse()
    .findByAddress({ address: Auction_House });

    const associatedAddress = getAssociatedTokenAddressSync(mindId, seller);

    const [sellerTradeState, sellertradeBump] = getAuctionHouseTradeState(
        auctionHouse.address,
        wallet.publicKey,
        associatedAddress,
        NATIVE_MINT,
        mindId,
        1,
        list_price,
    );
    const [buyerTradeState, tradeBump] = getAuctionHouseTradeState(
        (await auctionHouse).address,
        wallet.publicKey,
        associatedAddress,
        NATIVE_MINT,
        mindId,
        1,
        list_price
    )

    const [purchasereceipt, purchasereceiptBump] = PublicKey.findProgramAddressSync(
        [
            Buffer.from('purchase_receipt'), 
            sellerTradeState.toBuffer(),
            buyerTradeState.toBuffer()
        ], 
        new PublicKey(PROGRAM_ADDRESS)
    );
    const [listreceipt, listreceiptBump] = PublicKey.findProgramAddressSync(
        [
            Buffer.from('listing_receipt'), 
            sellerTradeState.toBuffer()
        ], 
        new PublicKey(PROGRAM_ADDRESS)
    );
    const [bidreceipt, bidreceiptBump] = PublicKey.findProgramAddressSync(
        [
            Buffer.from('bid_receipt'), 
            buyerTradeState.toBuffer()
        ], 
        new PublicKey(PROGRAM_ADDRESS)
    );

    const purchase_ix = createPrintPurchaseReceiptInstruction(
        {
            purchaseReceipt: purchasereceipt,
            listingReceipt: listreceipt,
            bidReceipt: bidreceipt,
            bookkeeper: wallet.publicKey,
            instruction: SYSVAR_INSTRUCTIONS_PUBKEY
        },
        {
            purchaseReceiptBump: purchasereceiptBump
        }
    )

    return purchase_ix
}

export const Cancel_bid_receipt = async (mindId, wallet, metaplex, bid_price) => {

    const auctionHouse = await metaplex
    .auctionHouse()
    .findByAddress({ address: Auction_House });

    const ata = getAssociatedTokenAddressSync(mindId, wallet.publicKey);

    const [buyerTradeState, tradeBump] = getAuctionHouseTradeState(
        (await auctionHouse).address,
        wallet.publicKey,
        associatedAddress,
        NATIVE_MINT,
        mindId,
        1,
        bid_price
    )

    const [receipt, receiptBump] = PublicKey.findProgramAddressSync(
        [
            Buffer.from('bid_receipt'), 
            buyerTradeState.toBuffer()
        ], 
        new PublicKey(PROGRAM_ADDRESS)
    );

    const cancelbidreceipt_ix = createCancelBidReceiptInstruction(
        {
            receipt: receipt,
            instruction: SYSVAR_INSTRUCTIONS_PUBKEY,
        }
    )

    return cancelbidreceipt_ix
}

export const Cancel_listing_receipt = async (mindId, wallet, metaplex, list_price) => {

    const auctionHouse = await metaplex
    .auctionHouse()
    .findByAddress({ address: Auction_House });

    const ata = getAssociatedTokenAddressSync(mindId, wallet.publicKey);

    const [sellerTradeState, tradeBump] = getAuctionHouseTradeState(
        auctionHouse.address,
        wallet.publicKey,
        ata,
        NATIVE_MINT,
        mindId,
        1,
        list_price,
    );

    const [receipt, receiptBump] = PublicKey.findProgramAddressSync(
        [
            Buffer.from('listing_receipt'), 
            sellerTradeState.toBuffer()
        ], 
        new PublicKey(PROGRAM_ADDRESS)
    );

    const cancellistreceipt_ix = createCancelListingReceiptInstruction(
        {
            receipt: receipt,
            instruction: SYSVAR_INSTRUCTIONS_PUBKEY
        }
    )

    return cancellistreceipt_ix
}