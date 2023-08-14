import styles from '../styles/Home.module.css';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Keypair ,clusterApiUrl, LAMPORTS_PER_SOL} from "@solana/web3.js";
import { Connection } from '@solana/web3.js';
import { Metaplex , SOL, lamports, sol,walletAdapterIdentity} from "@metaplex-foundation/js";
import { AuthorityScope } from '@metaplex-foundation/mpl-auction-house';
import bs58 from "bs58";
import React, { useState,useEffect  } from 'react';

export const Show_for_buy= ({ onClusterChange }) => {
  const [nftImages, setNftImages] = useState([]);
  const [selectedNFTIndex, setSelectedNFTIndex] = useState(-1);
  const [selectedBidNFTData, setSelectedBidNFTData] = useState(null);

  const wallet = useWallet();
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
  const metaplex = new Metaplex(connection); 
  metaplex.use(walletAdapterIdentity(wallet));
  const checkEligibility = async () => {
  };
  const handleNFTClick = async (index) => {
    const auctionHouse = await metaplex
        .auctionHouse()
        .findByAddress({ address: new PublicKey("DrLvt1M5qENHS6g9LSwzcWygo2Hb84a4AaSACvoS4a1") });
    const listings = await metaplex
        .auctionHouse()
        .findListings({ auctionHouse });
    try {
        if (selectedNFTIndex === index) {//邊框狀態
            setSelectedNFTIndex(-1);
          } else {
            setSelectedNFTIndex(index);
            const nft = await metaplex
              .auctionHouse()
              .findListingByReceipt({ auctionHouse, receiptAddress: new PublicKey(listings[index].receiptAddress.toString()) });
            console.log(nft.asset)
            setSelectedBidNFTData(nft)
            console.log(nft)
          }
          console.log(index)

        }catch (error){
            console.log(error)
        }
  }
  const handleBid = async()=>{
    if(selectedBidNFTData){
      const auctionHouse = await metaplex
        .auctionHouse()
        .findByAddress({ address: new PublicKey("DrLvt1M5qENHS6g9LSwzcWygo2Hb84a4AaSACvoS4a1") });
      const bid = await metaplex
        .auctionHouse()
        .bid({
          auctionHouse:auctionHouse, 
          seller:new PublicKey(selectedBidNFTData.sellerAddress.toString()),  
          buyer: metaplex.identity(),
          authority: auctionHouse.authorityAddress,
          printReceipt:true,
          mintAccount: new PublicKey(selectedBidNFTData.asset.address.toString()),                     
          price:lamports(10000000),
          bookkeeper: metaplex.identity()   
        });
      console.log("Success Bid , receipt : ",bid.receipt.toString())
    }
  }
  const buy_NFT = async()=>{
    if(selectedBidNFTData){
      const auctionHouse = await metaplex
        .auctionHouse()
        .findByAddress({ address: new PublicKey("DrLvt1M5qENHS6g9LSwzcWygo2Hb84a4AaSACvoS4a1") });
      console.log(selectedBidNFTData)
      // const listing = await metaplex
      //   .auctionHouse()
      //   .findListings({ 
      //     auctionHouse:auctionHouse, 
      //     seller:new PublicKey(selectedBidNFTData.sellerAddress.toString()), 
      //     mint :new PublicKey(selectedBidNFTData.asset.address.toString()),
      //   });
      const listing = await metaplex.auctionHouse().findListingByReceipt({
        auctionHouse: auctionHouse,
        receiptAddress: new PublicKey(selectedBidNFTData.receiptAddress),
      });
      console.log(listing)
      // console.log("your choosed listing",listing)
      // const create_bid = await metaplex
      //   .auctionHouse()
      //   .bid({
      //       auctionHouse:auctionHouse, 
      //       seller:new PublicKey(selectedBidNFTData.sellerAddress.toString()),  
      //       buyer: metaplex.identity(),
      //       authority: auctionHouse.authorityAddress,
      //       printReceipt:true,
      //       mintAccount: new PublicKey(selectedBidNFTData.asset.address.toString()),                     
      //       price:lamports(listing.price.basisPoints.words[0]),
      //       bookkeeper: metaplex.identity()
      //   });
      //   console.log("Success Bid , receipt : ",create_bid.receipt.toString())
      // const bid = await metaplex.auctionHouse().findBidByReceipt({
      //     auctionHouse: auctionHouse,
      //     receiptAddress: new PublicKey(create_bid.receipt.toString()),
      //   });
      // const purchase = await metaplex
      // .auctionHouse()
      // .executeSale({
      //   auctionHouse:auctionHouse,
      //   bid:bid,
      //   listing:listing,
      //   printReceipt: true,
      //   bookkeeper: metaplex.identity(),
      // })
      // console.log(purchase)
      const directBuyResponse = await metaplex
        .auctionHouse()
        .buy({
            auctionHouse, 
            buyer: metaplex.identity(),  
            authority: auctionHouse.authorityAddress, 
            listing: listing,               
            price: lamports(listing.price.basisPoints.words[0]),                      
        });
          };
  }

  const AH_nfts = async() => {
      const auctionHouse = await metaplex
          .auctionHouse()
          .findByAddress({ address: new PublicKey("DrLvt1M5qENHS6g9LSwzcWygo2Hb84a4AaSACvoS4a1") });
      const listings = await metaplex
          .auctionHouse()
          .findListings({ auctionHouse });
      const nftImagesPromises = listings.map(async (listing) => {
          const nft = await metaplex
            .auctionHouse()
            .findListingByReceipt({ auctionHouse, receiptAddress: new PublicKey(listing.receiptAddress.toString()) });
          //return nft.asset.json.image; //過濾售出
          if (!nft.purchaseReceiptAddress) {
            return nft.asset.json.image;
          }
        });
        const nftImages = await Promise.all(nftImagesPromises);
        setNftImages(nftImages); //顯示所有nft，包括已售出的部分
        // const filteredNftImages = (await Promise.all(nftImagesPromises)).filter(Boolean);//過濾售出
        // setNftImages(filteredNftImages);
  }
  useEffect(() => {
      if (wallet.connected) {
        checkEligibility();
        //AH_nfts();
      }
    }, [wallet.connected]);
  
  if (!wallet.connected) {
      return null;
  }else {
      checkEligibility();
  }

  return (
    <div>
      <div className={styles.nftForm_find}>
        <div className={styles.container}>
          <div className={styles.nftForm}>
            { nftImages.map((image, index) => (
              <img 
                key={index}
                className ={`${styles.nftImage} ${selectedNFTIndex === index ? styles.selectedNFT : ''}`}
                src={image}
                alt="AH NFT"
                onClick={() => handleNFTClick(index)}
                style={{ width: '200px', height: '200px' }}
              />
              ))}
          </div>
          <div className={styles.list_con}><button onClick={handleBid}>place a bid</button>
          <button onClick={buy_NFT}>buy</button></div>
        </div>
      </div>
    </div>
  );
};