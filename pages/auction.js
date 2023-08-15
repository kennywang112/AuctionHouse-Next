import styles from '../styles/Home.module.css';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Keypair ,clusterApiUrl, LAMPORTS_PER_SOL, sendAndConfirmRawTransaction} from "@solana/web3.js";
import { Connection,Transaction,SystemProgram,SYSVAR_INSTRUCTIONS_PUBKEY,SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import { Metaplex ,  isMetaplexFile,  keypairIdentity,  lamports,toLazyBid,walletAdapterIdentity } from "@metaplex-foundation/js";
import { createSellRemainingAccountsInstruction , PROGRAM_ADDRESS , createExecuteSaleRemainingAccountsInstruction , createSellInstruction , createCancelRemainingAccountsInstruction, createExecuteSaleInstruction , createPrintListingReceiptInstruction } from "@metaplex-foundation/mpl-auction-house";
import bs58 from "bs58";
import { getAssociatedTokenAddressSync,getAccount ,getMint,NATIVE_MINT} from "@solana/spl-token";
import { TOKEN_PROGRAM_ID } from '@project-serum/anchor/dist/cjs/utils/token';
import { BN } from "@project-serum/anchor"
import { setComputeUnitLimit } from "@metaplex-foundation/mpl-essentials"
export const Auction_house_pnft = ({ onClusterChange }) => {

    const wallet = useWallet();
    const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
    const metaplex = new Metaplex(connection);
    metaplex.use(walletAdapterIdentity(wallet));// keypairIdentity無法完成以下所有操作，需改成walletAdapterIdentity

    let TOKEN_METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s')
    let TOKEN_AUTH_RULES_ID = new PublicKey('auth9SigNpDKz4sJJ1DfCTuZrZNSAgh9sFD3rboVmgg');
    let AUTH_RULES = new PublicKey("eBJLFYPxJmMGKuFwpDWkzxZeUrad92kZRC5BJLpzyT9")
    
    let auctionHouse = metaplex
      .auctionHouse()
      .findByAddress({ address: new PublicKey("DYJGVipuxyXpJoPqzFLq44e5xJWRzao6qu12TTioAMWq") });
    let seller = new PublicKey('F4rMWNogrJ7bsknYCKEkDiRbTS9voM7gKU2rcTDwzuwf')
    let buyer = new PublicKey('Se9gzT3Ep3E452LPyYaWKYqcCvsAwtHhRQwQvmoXFxG')
    let mindId = new PublicKey('39on12Uw9AqbkxoxRonq2Zy2DcdZqYJ1UBg5Kw3RzQi2')
    let bid_receipt = new PublicKey("3EEc73M8RxY8T5oSb5UQDAJerVb1mUBbPf947mErDDBL")
    let list_receipt = new PublicKey("J2FykeLjbfpirnahtYpE44XGb3uqTHGVEoFswtTkQLq9")

    let masterEdition = PublicKey.findProgramAddressSync(
      [
        Buffer.from('metadata'),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mindId.toBuffer(),
        Buffer.from('edition'),
      ],
      TOKEN_METADATA_PROGRAM_ID
    )[0];

    let [metadata,metadata_bump] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('metadata'),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mindId.toBuffer(),
      ],
      TOKEN_METADATA_PROGRAM_ID,
    );

    let [signer, signerBump] = PublicKey.findProgramAddressSync(
      [Buffer.from('auction_house'), Buffer.from('signer')],
      new PublicKey(PROGRAM_ADDRESS),
    );

    const checkEligibility = async () => {

    };

  const Item_list = async () => {
    (async () => {
      auctionHouse = await auctionHouse

      const ata = getAssociatedTokenAddressSync(mindId, wallet.publicKey);
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
      const delegateRecord = PublicKey.findProgramAddressSync(
        [
          Buffer.from('metadata'),
          TOKEN_METADATA_PROGRAM_ID.toBuffer(),
          mindId.toBuffer(),
          Buffer.from('delegate_record'),
          ata.toBuffer(),
        ],
        TOKEN_METADATA_PROGRAM_ID
      )[0];
      
      const remain_ix = createSellRemainingAccountsInstruction(
        {
          metadataProgram:TOKEN_METADATA_PROGRAM_ID,
          delegateRecord:metaplex.auctionHouse().pdas().programAsSigner(),//delegateRecord,
          tokenRecord:tokenRecord,
          tokenMint:mindId,
          edition:masterEdition,
          authRulesProgram:new PublicKey('auth9SigNpDKz4sJJ1DfCTuZrZNSAgh9sFD3rboVmgg'),
          authRules:new PublicKey('eBJLFYPxJmMGKuFwpDWkzxZeUrad92kZRC5BJLpzyT9') ,//new PublicKey('AdH2Utn6Fus15ZhtenW4hZBQnvtLgM1YCW2MfVp7pYS5'),
          sysvarInstructions:SYSVAR_INSTRUCTIONS_PUBKEY,
        }
      )

      //第一種
      // async function getAuctionHouseTradeState(
      //   auctionHouse,
      //   wallet,
      //   tokenAccount,
      //   treasuryMint,
      //   tokenMint,
      //   tokenSize,
      //   buyPrice,
      // ) {
      //   return await PublicKey.findProgramAddressSync(
      //     [
      //       Buffer.from('auction_house'),
      //       wallet.toBuffer(),
      //       auctionHouse.toBuffer(),
      //       tokenAccount.toBuffer(),
      //       treasuryMint.toBuffer(),
      //       tokenMint.toBuffer(),
      //       new BN(buyPrice).toArrayLike(Buffer, 'le', 8),
      //       new BN(tokenSize).toArrayLike(Buffer, 'le', 8),
      //     ],
      //     new PublicKey(PROGRAM_ADDRESS),
      //   );
      // }
      // const token_ata = getAssociatedTokenAddressSync(mindId, metaplex.identity().publicKey);
      // const [sellerTradeState, tradeBump] = await getAuctionHouseTradeState(
      //   auctionHouse.address,
      //   wallet.publicKey,
      //   token_ata,
      //   NATIVE_MINT,
      //   mindId,
      //   1,
      //   '10000000',
      // );
      // const [freeTradeState, freeTradeBump] = await getAuctionHouseTradeState(
      //   auctionHouse.address,
      //   metaplex.identity().publicKey,
      //   token_ata,
      //   NATIVE_MINT,
      //   mindId,
      //   1,
      //   '0',
      // );

      // const remain = [
      //   {//metadata program
      //     pubkey: TOKEN_METADATA_PROGRAM_ID,
      //     isWritable: false,
      //     isSigner: false
      //   },
      //   {//delegate record
      //     pubkey: delegateRecord,
      //     isWritable: true,
      //     isSigner: false,
      //   },
      //   {//token record
      //     pubkey: tokenRecord,
      //     isWritable: true,
      //     isSigner: false,
      //   },
      //   {//mint id
      //     pubkey: mindId,
      //     isWritable: false,
      //     isSigner: false,
      //   },
      //   {//edition
      //     pubkey: masterEdition,
      //     isWritable: false,
      //     isSigner: false,
      //   },
      //   {//auth rules program
      //     pubkey: new PublicKey('auth9SigNpDKz4sJJ1DfCTuZrZNSAgh9sFD3rboVmgg'),
      //     isWritable: false,
      //     isSigner: false,
      //   },
      //   {//auth rules
      //     // pubkey: TOKEN_METADATA_PROGRAM_ID,
      //     pubkey: new PublicKey('AdH2Utn6Fus15ZhtenW4hZBQnvtLgM1YCW2MfVp7pYS5'),
      //     isWritable: false,
      //     isSigner: false,
      //   },
      //   {//sysvar instruction
      //     pubkey: SYSVAR_INSTRUCTIONS_PUBKEY,
      //     isWritable: false,
      //     isSigner: false,
      //   },
      // ]
      // const accounts = {
      //   wallet:metaplex.identity().publicKey,
      //   tokenAccount:token_ata,
      //   metadata:metadata,
      //   authority:auctionHouse.authorityAddress,
      //   auctionHouse:auctionHouse.address,
      //   auctionHouseFeeAccount:auctionHouse.feeAccountAddress,
      //   sellerTradeState:sellerTradeState,
      //   freeSellerTradeState:freeTradeState,
      //   tokenProgram:TOKEN_PROGRAM_ID,
      //   systemProgram:SystemProgram.programId,
      //   programAsSigner:signer,
      //   rent:SYSVAR_RENT_PUBKEY,
      //   anchorRemainingAccounts:remain
      // }
      // const args = {
      //   tradeStateBump:tradeBump,
      //   freeTradeStateBump:freeTradeBump,
      //   programAsSignerBump:signerBump,
      //   buyerPrice: new BN(10000000),
      //   tokenSize: new BN(Math.ceil(1 * 1))
      // }
      // const sellInstruction = createSellInstruction(accounts,args)
      // let tx = new Transaction();
      // tx.add(sellInstruction)
      // tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash
      // tx.feePayer = wallet.publicKey
      // tx.instructions[0].keys[2].isWritable = true
      // tx.instructions[0].keys[10].isWritable = false
      // console.log(tx)
      // metaplex.rpc().sendAndConfirmTransaction(tx,[metaplex.identity()])

      //第二種
      const ix = metaplex.auctionHouse().builders()
        .list({
            auctionHouse:auctionHouse,  
            seller: metaplex.identity(),
            authority: auctionHouse.authorityAddress,
            bookkeeper:metaplex.identity(),     
            mintAccount: mindId,
            price:lamports(345000000)
        })
      for(const i of remain_ix.keys){
        ix.records[0].instruction.keys.push(i)
      }
      ix.records[0].instruction.keys[2].isWritable = true
      ix.records[0].instruction.keys[10].isWritable = false

      const userAta = await getAccount(connection,ata)
      console.log(userAta)
      console.log(delegateRecord)
      ix.sendAndConfirm(metaplex)

  })();
  }
  const Item_bid = async () => {
    (async () => {
      auctionHouse = await auctionHouse

      const bid = await metaplex
        .auctionHouse()
        .bid({
            auctionHouse:auctionHouse, 
            seller: seller,  
            buy : metaplex.identity(),
            authority: auctionHouse.authorityAddress,
            printReceipt:true,
            mintAccount: mindId,                     
            price:lamports(345000000),
            bookkeeper: metaplex.identity()   
        });

        console.log(bid)
        console.log('success')
  })();
  }
  const execute = async () => {
    (async () => {

      auctionHouse = await auctionHouse

      const listing = await metaplex.auctionHouse().findListingByReceipt({
        auctionHouse: auctionHouse,
        receiptAddress: list_receipt
      });
      const bid = await metaplex.auctionHouse().findBidByReceipt({
        auctionHouse: auctionHouse,
        receiptAddress: bid_receipt
      });

      // for remaining account token record
      const associatedAddress = await getAssociatedTokenAddressSync(mindId,seller)
      const des_associatedAddress = await getAssociatedTokenAddressSync(mindId,buyer)

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
          des_associatedAddress.toBuffer(),
        ],
        TOKEN_METADATA_PROGRAM_ID
      )[0];

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

      const purchase = await metaplex
        .auctionHouse().builders()
        .executeSale({
          auctionHouse: auctionHouse,
          bid: bid,
          listing: listing,
          printReceipt: true,
          bookkeeper: metaplex.identity(),
      })
      for(const i of execute_remain.keys){
        purchase.records[0].instruction.keys.push(i)
      }
      purchase.records[0].instruction.keys[4].isWritable = true

      await purchase.sendAndConfirm(metaplex)
      
      console.log('success')
  })();
  }
  const buy = async () => {
    (async () => {
      auctionHouse = await auctionHouse
      
      const listing = await metaplex.auctionHouse().findListingByReceipt({
        auctionHouse: auctionHouse,
        receiptAddress: list_receipt
      });

      const bid = await metaplex.auctionHouse().findBidByReceipt({
        auctionHouse: auctionHouse,
        receiptAddress: bid_receipt
      });

      const ata = getAssociatedTokenAddressSync(mindId, seller);
      const des_associatedAddress = getAssociatedTokenAddressSync(mindId, buyer)

      const owner_tokenRecord = PublicKey.findProgramAddressSync(
        [
          Buffer.from('metadata'),
          TOKEN_METADATA_PROGRAM_ID.toBuffer(),
          mindId.toBuffer(),
          Buffer.from('token_record'),
          ata.toBuffer(),
        ],
        TOKEN_METADATA_PROGRAM_ID
      )[0];

      const des_tokenRecord = PublicKey.findProgramAddressSync(
        [
          Buffer.from('metadata'),
          TOKEN_METADATA_PROGRAM_ID.toBuffer(),
          mindId.toBuffer(),
          Buffer.from('token_record'),
          des_associatedAddress.toBuffer(),
        ],
        TOKEN_METADATA_PROGRAM_ID
      )[0];

      const directBuyResponse = await metaplex
        .auctionHouse().builders()
        .buy({
            auctionHouse: auctionHouse, 
            buyer: metaplex.identity(),  
            authority: auctionHouse.authorityAddress, 
            listing: listing,               
            price: lamports(listing.price.basisPoints.toString()),                      
        });

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

      for(const i of execute_remain.keys){
        directBuyResponse.records[2].instruction.keys.push(i)
      }

      directBuyResponse.records.splice(3,1)

      console.log(bid.price.basisPoints.toString())
      console.log(listing.price.basisPoints.toString())
      directBuyResponse.sendAndConfirm(metaplex,{skipPreflight:false})

  })();
  }
  const buy_old = async () => {
    //the code is to change the execute in buy

    auctionHouse = await auctionHouse
    
    const listing = await metaplex.auctionHouse().findListingByReceipt({
      auctionHouse: auctionHouse,
      receiptAddress: list_receipt
    });

    // for remaining account token record
    const associatedAddress = await getAssociatedTokenAddressSync(mindId,seller)
    const des_associatedAddress = await getAssociatedTokenAddressSync(mindId,buyer)

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
        des_associatedAddress.toBuffer(),
      ],
      TOKEN_METADATA_PROGRAM_ID
    )[0];
    
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

    const bid_ix= await metaplex
    .auctionHouse().builders()
    .bid({
        auctionHouse:auctionHouse, 
        seller: seller,  
        buy : metaplex.identity(),
        authority: auctionHouse.authorityAddress,
        printReceipt:true,
        mintAccount: mindId,                     
        price:lamports(listing.price.basisPoints.toString()),
        bookkeeper: metaplex.identity()   
    });
    bid_ix.records.splice(1,1)

    const direct_bid = await metaplex
      .auctionHouse()
      .findBids({ auctionHouse, buyer, metadata , mindId});
    const bid_to_receipt = await metaplex.auctionHouse().findBidByReceipt({
      auctionHouse: auctionHouse,
      receiptAddress: direct_bid[0].receiptAddress
    });

    const purchase_ix = await metaplex
      .auctionHouse().builders()
      .executeSale({
        auctionHouse: auctionHouse,
        bid: bid_to_receipt,
        listing: listing,
        printReceipt: true,
        bookkeeper: metaplex.identity(),
    })

    for(const i of execute_remain.keys){
      purchase_ix.records[0].instruction.keys.push(i)
    }
    purchase_ix.records[0].instruction.keys[4].isWritable = true

    bid_ix.records.push(purchase_ix.records[0])

    console.log(bid_ix)
    bid_ix.sendAndConfirm(metaplex)
  }
  const sell = async () => {
    (async () => {

      auctionHouse = await auctionHouse

      const bid = await metaplex.auctionHouse().findBidByReceipt({
        auctionHouse: auctionHouse,
        receiptAddress: bid_receipt
      });

      const directSellResponse = await metaplex
        .auctionHouse().builders()
        .sell({
            auctionHouse: auctionHouse,                            
            seller: metaplex.identity(),        
            authority: auctionHouse.authorityAddress,
            bid: bid,
            sellerToken: mindId
        });

      const ata = getAssociatedTokenAddressSync(mindId, wallet.publicKey);
      const des_associatedAddress = getAssociatedTokenAddressSync(mindId,buyer)

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

      const delegateRecord = PublicKey.findProgramAddressSync(
        [
          Buffer.from('metadata'),
          TOKEN_METADATA_PROGRAM_ID.toBuffer(),
          mindId.toBuffer(),
          Buffer.from('delegate_record'),
          ata.toBuffer(),
        ],
        TOKEN_METADATA_PROGRAM_ID
      )[0];

      // for remaining account token record
      const owner_tokenRecord = PublicKey.findProgramAddressSync(
        [
          Buffer.from('metadata'),
          TOKEN_METADATA_PROGRAM_ID.toBuffer(),
          mindId.toBuffer(),
          Buffer.from('token_record'),
          ata.toBuffer(),
        ],
        TOKEN_METADATA_PROGRAM_ID
      )[0];

      const des_tokenRecord = PublicKey.findProgramAddressSync(
        [
          Buffer.from('metadata'),
          TOKEN_METADATA_PROGRAM_ID.toBuffer(),
          mindId.toBuffer(),
          Buffer.from('token_record'),
          des_associatedAddress.toBuffer(),
        ],
        TOKEN_METADATA_PROGRAM_ID
      )[0];

      const sell_ix = createSellRemainingAccountsInstruction(
        {
          metadataProgram: TOKEN_METADATA_PROGRAM_ID,
          delegateRecord: delegateRecord,
          tokenRecord: tokenRecord,
          tokenMint: mindId,
          edition: masterEdition,
          authRulesProgram: TOKEN_AUTH_RULES_ID,
          authRules: AUTH_RULES,
          sysvarInstructions:SYSVAR_INSTRUCTIONS_PUBKEY,
        }
      )

      const execute_remain = createExecuteSaleRemainingAccountsInstruction(
        {
          metadataProgram: TOKEN_METADATA_PROGRAM_ID,
          edition: masterEdition,
          ownerTr: owner_tokenRecord,
          destinationTr:des_tokenRecord,
          authRulesProgram: new PublicKey('auth9SigNpDKz4sJJ1DfCTuZrZNSAgh9sFD3rboVmgg'),
          authRules: new PublicKey("eBJLFYPxJmMGKuFwpDWkzxZeUrad92kZRC5BJLpzyT9"),//new PublicKey('AdH2Utn6Fus15ZhtenW4hZBQnvtLgM1YCW2MfVp7pYS5'),
          sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY,
        }
      )

      for(const i of sell_ix.keys){
        directSellResponse.records[0].instruction.keys.push(i)
      }
      directSellResponse.records[0].instruction.keys[2].isWritable = true

      for(const i of execute_remain.keys){
        directSellResponse.records[2].instruction.keys.push(i)
      }
      directSellResponse.records[2].instruction.keys[4].isWritable = true

      //remove receipt
      directSellResponse.records.splice(1,1)
      directSellResponse.records.splice(2,1)

      console.log(directSellResponse)
      directSellResponse.sendAndConfirm(metaplex,{skipPreflight:false})

      
  })();
  }
  //cancel listing
  const cancel = async () => {
     
    auctionHouse = await auctionHouse

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
    const cancelListingtx = metaplex
      .auctionHouse().builders().cancelListing({
          auctionHouse: auctionHouse,
          listing: listing,        
      });
    for (const i of remain_ix.keys) {
      cancelListingtx.records[0].instruction.keys.push(i)
    }
    cancelListingtx.records[0].instruction.keys[2].isWritable = true
    cancelListingtx.sendAndConfirm(metaplex)

  }
  const find = async () => {

    auctionHouse = await auctionHouse
    const bid = await metaplex.auctionHouse().findBidByReceipt({
      auctionHouse: auctionHouse,
      receiptAddress: bid_receipt
    });
    const listing = await metaplex.auctionHouse().findListingByReceipt({
      auctionHouse: auctionHouse,
      receiptAddress: list_receipt
    });

    const bids = await metaplex
      .auctionHouse()
      .findBids({ auctionHouse, buyer, metadata ,mindId});
    const listings = await metaplex
      .auctionHouse()
      .findListings({ auctionHouse, seller, metadata });

    const ata = getAssociatedTokenAddressSync(mindId, seller);
    const nft = await getAccount(connection,ata)

    console.log(bid.price.basisPoints.toString())
    console.log(listing.price.basisPoints.toString())

  }

    if (!wallet.connected) {
        return null;
    }else {
        checkEligibility();
    }

  return (
    <div>
      <div>
        <div className={styles.container}>
          <div className={styles.nftForm}>
          {/* <button onClick={Auction_setting}>create</button>
          <button onClick={auctionhouse_update}>update</button> */}
          <button onClick={Item_list}>list</button>
          <button onClick={Item_bid}>bid</button>
          <button onClick={execute}>execute</button>
          </div>
        </div>
        <div className={styles.container}>
          <div className={styles.nftForm}>
          <button onClick={buy}>buy</button>
          <button onClick={sell}>sell</button>
          <button onClick={cancel}>cancel listing</button>
          <button onClick={find}>find</button>
          </div>
        </div>
      </div>
    </div>
  );
};