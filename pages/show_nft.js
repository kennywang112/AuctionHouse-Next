import styles from '../styles/Home.module.css';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Keypair ,clusterApiUrl, LAMPORTS_PER_SOL} from "@solana/web3.js";
import { Connection } from '@solana/web3.js';
import { Metaplex , SOL, lamports, sol,walletAdapterIdentity} from "@metaplex-foundation/js";
import { AuthorityScope } from '@metaplex-foundation/mpl-auction-house';
import bs58 from "bs58";
import React, { useState,useEffect  } from 'react';

export const Show_NFT= ({ onClusterChange }) => {
  const [nftImages, setNftImages] = useState([]);
  const [selectedNFTData, setSelectedNFTData] = useState(null);
  const [selectedNFTIndex, setSelectedNFTIndex] = useState(-1);
  const [AHnftImages, setAHNftImages] = useState([]);


  const wallet = useWallet();
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
  //const connection = new Connection("https://young-spring-general.solana-devnet.discover.quiknode.pro/d12b9e4e78137010da62d49e35a0065d56be0b08/","confirmed");
  const metaplex = new Metaplex(connection); 
  metaplex.use(walletAdapterIdentity(wallet));// keypairIdentity無法完成以下所有操作，需改成walletAdapterIdentity
  const checkEligibility = async () => {
  };
  const find_nft = async () => {//第一個帳戶測試無auctioneer的 AH DYJGVipuxyXpJoPqzFLq44e5xJWRzao6qu12TTioAMWq
    try {
        const all_nft = await metaplex.nfts().findAllByOwner({
          owner: metaplex.identity().publicKey
        });
        console.log(all_nft)

        const nftImagesPromises = all_nft.map(async (nft) => {
          const nftData = await metaplex.nfts().findByMint({
            mintAddress: new PublicKey(nft.mintAddress.toString())
          });
          return nftData.json.image;
        });
    
        const nftImages = await Promise.all(nftImagesPromises);
        console.log(nftImages);
        setNftImages(nftImages);
      } catch (error) {
        console.error(error);
      }    
  }
  const handleNFTClick = async (index) => {
    const auctionHouse = await metaplex
    .auctionHouse()
    .findByAddress({ address: new PublicKey("DrLvt1M5qENHS6g9LSwzcWygo2Hb84a4AaSACvoS4a1") });
      try {
          if (selectedNFTIndex === index) {//邊框狀態
              setSelectedNFTIndex(-1);
            } else {
              setSelectedNFTIndex(index);
            }

          const all_nft =await metaplex.nfts().findAllByOwner({
            owner: metaplex.identity().publicKey
          });
    
          const nftData = await metaplex.nfts().findByMint({
            mintAddress: new PublicKey(all_nft[index].mintAddress.toString())
          });
    
          setSelectedNFTData(nftData);
          console.log(nftData);

          const updatedNftImages = [...nftImages];
          updatedNftImages[index] = `${nftImages[index]} (Selected)`;
          setNftImages(updatedNftImages);
        } catch (error) {
          console.error(error);
        }
    };
  const handlelistData = async() => {
      if (selectedNFTData) {
        console.log("your list:", selectedNFTData.address.toString());

      const auctionHouse = await metaplex
          .auctionHouse()
          .findByAddress({ address: new PublicKey("DrLvt1M5qENHS6g9LSwzcWygo2Hb84a4AaSACvoS4a1") });
      const list = await metaplex
          .auctionHouse()
          .list({
          auctionHouse:auctionHouse,  
          seller: metaplex.identity(),
          authority: auctionHouse.authorityAddress,
          bookkeeper:metaplex.identity(),     
          mintAccount: new PublicKey(selectedNFTData.address.toString()),
          price:lamports(10000000)
          },{
          confirmOptions: {
              skipPreflight: true
              }
          });
      const listings = await metaplex
          .auctionHouse()
          .findListings({ auctionHouse });
      const receiptAddress = listings[0].receiptAddress.toString();
      console.log('Success listing , receipt : ',listings[0].receiptAddress.toString())
      }
    };

  if (!wallet.connected) {
      return null;
  }else {
      checkEligibility();
  }

  return (
    <div >
      <div>
        <div className={styles.container}>
          <div className={styles.nftForm}>
            <button onClick={find_nft}>nft</button>
          </div>
        </div>
        <div className={styles.nftImagesContainer}>
        {nftImages.map((nft, index) => (
              <img
                key={index}
                className={`${styles.nftImage} ${selectedNFTIndex === index ? styles.selectedNFT : ''}`}//邊框
                src={nft}
                alt="NFT"
                onClick={() => handleNFTClick(index)}
                style={{ width: '200px', height: '200px' }}
              />
            ))}
             </div>
             <div className={styles.nftForm_find}>
            <div className={styles.list_con}><button onClick={handlelistData}>list it</button></div>
            </div>
      </div>
    </div>
  );
};