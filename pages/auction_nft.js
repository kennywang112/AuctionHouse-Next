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

export const Auction_house_nft = ({ onClusterChange }) => {

    const wallet = useWallet();
    const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
    const metaplex = new Metaplex(connection);
    metaplex.use(walletAdapterIdentity(wallet));// keypairIdentity無法完成以下所有操作，需改成walletAdapterIdentity

    let TOKEN_METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s')

    let auctionHouse = metaplex
      .auctionHouse()
      .findByAddress({ address: new PublicKey("DYJGVipuxyXpJoPqzFLq44e5xJWRzao6qu12TTioAMWq") });
    let seller = new PublicKey('F4rMWNogrJ7bsknYCKEkDiRbTS9voM7gKU2rcTDwzuwf')
    let buyer = new PublicKey('Se9gzT3Ep3E452LPyYaWKYqcCvsAwtHhRQwQvmoXFxG')
    let mindId = new PublicKey('CE8xA5qSJpHGCqLxyJPxZLX9bNrcLJbt4eBUrz64989y')
    let bid_receipt = new PublicKey("3EEc73M8RxY8T5oSb5UQDAJerVb1mUBbPf947mErDDBL")
    let list_receipt = new PublicKey("5dxDLzhwt95sux4oCmG4Z1di2cdRGB8vawjKNbnmTDWV")

    let [metadata,metadata_bump] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('metadata'),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mindId.toBuffer(),
      ],
      TOKEN_METADATA_PROGRAM_ID,
    );

    const checkEligibility = async () => {

    };
    
  const Auction_setting = async () => {
      (async () => {
        const auth = metaplex.identity().publicKey.toString()
        const auctionHouseSettings = {
            authority: auth, //management
            sellerFeeBasisPoints: 150,
            auctionHouseFeeAccount: auth, //手續費
            auctionHouseTreasury: auth , //市場版稅
            feeWithdrawalDestination: auth, //可以從fee唱戶提取資金的帳戶
            treasuryWithdrawalDestination: auth,//可以從treasury賬戶提取資金的帳戶
            requireSignOff: true, //listing , bidding 等等的都將會由authority簽署
            canChangeSalePrice: true,
        };
        const auctionHouse = await metaplex
            .auctionHouse()
            .create({
            auctionHouseSettings
        });
        
        console.log(auctionHouse)
      })();
  }

  const auctionhouse_update = async () => {
    (async () => {
      const mysecret = bs58.decode("Bhao6w2hvn5LtBgJ6nAno3qTy6WMyn59k7sdbFdJVsRapumSJfF86hZ1wcWJ6SxuEhuJUwC2DoNu5YTA9DyMFSy")
        const auth = Keypair.fromSecretKey(mysecret)
      auctionHouse = await auctionHouse

      const updatedAuctionHouse = await metaplex
        .auctionHouse()
        .update({
            auctionHouse:auctionHouse,
            authority:auth,
            sellerFeeBasisPoints: 100,
            requiresSignOff: false,
            canChangeSalePrice: false,
            newAuthority: metaplex.identity().publicKey.toString(),
        });
      console.log(updatedAuctionHouse)
  })();
  }

  const Item_list = async () => {
    (async () => {
      auctionHouse = await auctionHouse

      const ix = metaplex.auctionHouse().builders()
        .list({
            auctionHouse:auctionHouse,  
            seller: metaplex.identity(),
            authority: auctionHouse.authorityAddress,
            bookkeeper:metaplex.identity(),     
            mintAccount: mindId,
            price:lamports(346000000)
        })

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
      const purchase = await metaplex
        .auctionHouse().builders()
        .executeSale({
          auctionHouse: auctionHouse,
          bid: bid,
          listing: listing,
          printReceipt: true,
          bookkeeper: metaplex.identity(),
      })
 
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

      const directBuyResponse = await metaplex
        .auctionHouse().builders()
        .buy({
            auctionHouse: auctionHouse, 
            buyer: metaplex.identity(),  
            authority: auctionHouse.authorityAddress, 
            listing: listing,               
            price: lamports(listing.price.basisPoints.toString()),                      
        });

      directBuyResponse.sendAndConfirm(metaplex,{skipPreflight:false})

  })();
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

      console.log(directSellResponse)
      directSellResponse.sendAndConfirm(metaplex,{skipPreflight:false})

      
  })();
  }

  const cancel = async () => {
     
    auctionHouse = await auctionHouse

    const ata = getAssociatedTokenAddressSync(mindId, wallet.publicKey);
    
    const listing = await metaplex.auctionHouse().findListingByReceipt({
      auctionHouse: auctionHouse,
      receiptAddress: list_receipt
    });

    const cancelListingtx = metaplex
      .auctionHouse().builders().cancelListing({
          auctionHouse: auctionHouse,
          listing: listing,        
      });
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