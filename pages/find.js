import styles from '../styles/Home.module.css';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Keypair ,clusterApiUrl, LAMPORTS_PER_SOL} from "@solana/web3.js";
import { Connection } from '@solana/web3.js';
import { Metaplex , SOL, lamports, sol,walletAdapterIdentity} from "@metaplex-foundation/js";
import { AuthorityScope, listingReceiptDiscriminator } from '@metaplex-foundation/mpl-auction-house';
import bs58 from "bs58";
import React, { useState } from 'react';
import { getParsedNftAccountsByOwner } from "@nfteyez/sol-rayz"

export const For_finding= ({ onClusterChange }) => {

  const wallet = useWallet();
  const connection = new Connection(clusterApiUrl("devnet"));
  const metaplex = new Metaplex(connection); 
  metaplex.use(walletAdapterIdentity(wallet));// keypairIdentity無法完成以下所有操作，需改成walletAdapterIdentity
  const checkEligibility = async () => {
    // const auctionHouse = await metaplex.auctionHouse().findByCreatorAndMint({
    //   creator:metaplex.identity().publicKey,
    //   treasuryMint: new PublicKey("So11111111111111111111111111111111111111112"),
    //   auctioneerAuthority : new PublicKey("38xYvEUfiEH6hKqtJ4xVCkGg18nsDDTSi8pkW5GbM628")
    // })
  };

  const [auctionHouseData, setAuctionHouseData] = useState(null);
  const [bidsData, setBidsData] = useState(null);
  const [listingsData, setListingsData] = useState(null);
  const [purchasesData, setPurchasesData] = useState(null);
  const [nftAccountsData, setNftAccountsData] = useState([]);

  const find_all = async () => {
    (async () => {
      // const auctionHouse = await metaplex.auctionHouse().findByCreatorAndMint({
      //   creator:new PublicKey("Se9gzT3Ep3E452LPyYaWKYqcCvsAwtHhRQwQvmoXFxG"),
      //   //creator:metaplex.identity().publicKey,
      //   treasuryMint: new PublicKey("So11111111111111111111111111111111111111112"),
      //   auctioneerAuthority : new PublicKey("38xYvEUfiEH6hKqtJ4xVCkGg18nsDDTSi8pkW5GbM628")
      // })
      const auctionHouse = await metaplex
          .auctionHouse()
          .findByAddress({ address: new PublicKey("DrLvt1M5qENHS6g9LSwzcWygo2Hb84a4AaSACvoS4a1") });
      console.log(auctionHouse.address.toString())
      setAuctionHouseData(auctionHouse);

      const bids = await metaplex
        .auctionHouse()
        .findBids({ auctionHouse });
      console.log("find bids : ",bids)
      setBidsData(bids);
      for (let i=0;i<bids.length;i++){
        const bider_address = bids[i].buyerAddress.toString()
        console.log("bidder address : ",bider_address)
      }

      const listings = await metaplex
        .auctionHouse()
        .findListings({ auctionHouse });
      console.log("find listing :",listings)
      setListingsData(listings);
      //const price = listings[i].price.basisPoints.words[0]
      for (let i=0;i<listings.length;i++){
        const seller_of_listing = listings[i].sellerAddress.toString()
        const price = listings[i].price.basisPoints.words[0]
        console.log("seller : ",seller_of_listing)
        console.log("price : ",price)
      }

      const purchases = await metaplex
        .auctionHouse()
        .findPurchases({ auctionHouse });
      console.log("find purchases :",purchases)
      setPurchasesData(purchases);
      for (let i=0;i<purchases.length;i++){
        const buyer_address = purchases[i].buyerAddress.toString()
        const seller_address = purchases[i].sellerAddress.toString()
        console.log("buyer : ",buyer_address)
        console.log("seller : ",seller_address)
      }

  })();
  }
  const displayNftAccounts = async () => {
    const nftaccounts = await getParsedNftAccountsByOwner({
      publicAddress: metaplex.identity().publicKey,
      connection: connection
    });
    setNftAccountsData(nftaccounts.map(account => account.mint.toString()));
  };
  const Item_list = async () => {
    (async () => {
      const auctionHouse = await metaplex
      .auctionHouse()
      .findByAddress({ address: new PublicKey("DrLvt1M5qENHS6g9LSwzcWygo2Hb84a4AaSACvoS4a1") });
      const mint = document.getElementById("mintInput").value;
      const list = await metaplex
        .auctionHouse()
        .list({
          auctionHouse:auctionHouse,  
          seller: metaplex.identity(),
          authority: auctionHouse.authorityAddress,
          bookkeeper:metaplex.identity(),     
          mintAccount: new PublicKey(mint),
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
      document.getElementById("result").textContent = receiptAddress;
      console.log(listings[0].receiptAddress.toString())
  })();
  }
  const Item_bid = async () => {
    (async () => {
      const auctionHouse = await metaplex
          .auctionHouse()
          .findByAddress({ address: new PublicKey("DrLvt1M5qENHS6g9LSwzcWygo2Hb84a4AaSACvoS4a1") });
      const mint_add = document.getElementById("mintaddInput").value;
      const seller_add = document.getElementById("sellerinput").value;
      const find_listings = await metaplex
      .auctionHouse()
      .findListings({ 
        auctionHouse, 
        seller:new PublicKey("Se9gzT3Ep3E452LPyYaWKYqcCvsAwtHhRQwQvmoXFxG"), 
        mint:new PublicKey('FvLMvtzSuF5AZ4vmYyiMauP2npgx88SaLaw1fJpVv31J') 
      });
      console.log(find_listings)
      const bid = await metaplex
        .auctionHouse()
        .bid({
            auctionHouse:auctionHouse, 
            seller:new PublicKey(seller_add),  
            buyer: metaplex.identity(),
            authority: auctionHouse.authorityAddress,
            printReceipt:true,
            mintAccount: new PublicKey(mint_add),                     
            price:lamports(10000000),
            //tokens: 1,    
            bookkeeper: metaplex.identity()   
        });
        const receiptAddress = bid[0].receiptAddress.toString();
        document.getElementById("result").textContent = receiptAddress;
      console.log(bid[0].receiptAddress.toString())
      // const bids = await metaplex
      //   .auctionHouse()
      //   .findBids({ auctionHouse,buyer: metaplex.identity().publicKey.value,mint: new PublicKey('FvLMvtzSuF5AZ4vmYyiMauP2npgx88SaLaw1fJpVv31J') });
      // console.log(bids)
  })();
  }
  const Item_execute = async () => {
    (async () => {
      const auctionHouse = await metaplex
          .auctionHouse()
          .findByAddress({ address: new PublicKey("DrLvt1M5qENHS6g9LSwzcWygo2Hb84a4AaSACvoS4a1") });
      const listing_rec = document.getElementById("listingrecInput").value;
      const bid_rec = document.getElementById("bidrecInput").value;

      const listing = await metaplex.auctionHouse().findListingByReceipt({
        auctionHouse: auctionHouse,
        receiptAddress: new PublicKey(listing_rec),
      });
      console.log(listing)
      const bid = await metaplex.auctionHouse().findBidByReceipt({
        auctionHouse: auctionHouse,
        receiptAddress: new PublicKey(bid_rec),
      });

      const purchase = await metaplex
      .auctionHouse()
      .executeSale({
        auctionHouse:auctionHouse,
        bid:bid,
        listing:listing,
        printReceipt: true,
        bookkeeper: metaplex.identity(),
      })
  })();
  }

  if (!wallet.connected) {
      return null;
  }else {
      checkEligibility();
  }

  return (
    <div className={styles.nftForm_find}>
      <div>
        <button onClick={find_all}>find all</button>
      </div>
      <div style={{ maxHeight: '200px', overflowY: 'auto' }} >
        {auctionHouseData && (
          <div id="result" style={{ background: '#eaeaea', padding: '10px' }}>
            Auction House Address:
            <pre>{auctionHouseData.address.toString()}</pre>
          </div>
        )}
        {bidsData && (
          <div id="result" style={{ background: '#eaeaea', padding: '10px' }}>
            Bids Data:
            {bidsData.map((bid, index) => (
        <div key={index}>
          Bidder Address: {bid.buyerAddress.toString()}
          <br />
          receipt: {bid.receiptAddress.toString()}
        </div>
      ))}
          </div>
        )}
        {listingsData && (
          <div id="result" style={{ background: '#eaeaea', padding: '10px' }}>
            Listings Data:
            {listingsData.map((listing, index) => (
            <div key={index}>
              Seller: {listing.sellerAddress.toString()}
              <br />
              Price: {listing.price.basisPoints.words[0]}
              <br />
              Receipt : {listing.receiptAddress.toString()}
              <br />
            </div>
          ))}
          </div>
        )}
        {purchasesData && (
          <div id="result" style={{ background: '#eaeaea', padding: '10px' }}>
            Purchases Data:
            {purchasesData.map((purchase, index) => (
            <div key={index}>
              Buyer: {purchase.buyerAddress.toString()}
              <br />
              Seller: {purchase.sellerAddress.toString()}
            </div>
          ))}
          </div>
        )}
      </div>
      <div>
      <button onClick={displayNftAccounts}>Display NFT Accounts</button>
      <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
        {nftAccountsData.length > 0 && (
          <div id="result" style={{ background: '#eaeaea', padding: '10px' }}>
            NFT Accounts:
            {nftAccountsData.map((mint, index) => (
              <div key={index}>{mint}</div>
            ))}
          </div>
        )}</div>
      </div>
      <div>
      </div>
      <div>
        <input type="text" id="mintInput" placeholder="NFT Mint Address"></input>
        <button onClick={Item_list}>list</button>
        <div id="result"></div>
      </div>
      <div>
        <input type="text" id="mintaddInput" placeholder="NFT Mint Address"></input>
        <input type="text" id="sellerinput" placeholder="Seller Address"></input>
        <button onClick={Item_bid}>place a bid</button>
        <div id="result"></div>
      </div>
      <div>
        <input type="text" id="listingrecInput" placeholder="Listing receiptAddress"></input>
        <input type="text" id="bidrecInput" placeholder="Bid receiptAddress"></input>
        <button onClick={Item_execute}>execute</button>
        <div id="result"></div>
      </div>
    </div>
  );
};