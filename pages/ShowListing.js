import styles from '../styles/Home.module.css';
import { useState } from 'react';
import { Keypair, Transaction, PublicKey, ComputeBudgetProgram } from '@solana/web3.js';
import { getAssociatedTokenAddressSync, getAccount , getMint, NATIVE_MINT} from "@solana/spl-token";
import { List, Bid, Execute, Buy, Sell, Print_list_receipt } from "./useAuction"
import bs58 from "bs58";
import { Metaplex ,  isMetaplexFile,  keypairIdentity,  lamports, walletAdapterIdentity } from "@metaplex-foundation/js";
import { Connection, clusterApiUrl, SystemProgram } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';

export const Show_Listing = ({ onClusterChange }) => {

    const [nftImages, setNftImages] = useState([]);

    const wallet = useWallet();
    const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
    const metaplex = new Metaplex(connection);

    let bs = bs58.decode("Bhao6w2hvn5LtBgJ6nAno3qTy6WMyn59k7sdbFdJVsRapumSJfF86hZ1wcWJ6SxuEhuJUwC2DoNu5YTA9DyMFSy");
    let ah_auth_wallet = Keypair.fromSecretKey(bs);
    let collection = "5GeacVD7QnHT4fKGtMgXFBc4t6o11taHk6PZDS8qzqCC"

    let listing_info = []
    let nfts_info = [];
    let delegate = [];

    const checkEligibility = async () => {
    };

    const find_listings = async () => {

        const auctionHouse = await metaplex
            .auctionHouse()
            .findByAddress({ address: new PublicKey("DYJGVipuxyXpJoPqzFLq44e5xJWRzao6qu12TTioAMWq") });

        const listings = await metaplex.auctionHouse().findListings({ auctionHouse })

        for (const listing of listings) {

            const nft = await metaplex
                .auctionHouse()
                .findListingByReceipt({ receiptAddress: listing.receiptAddress, auctionHouse })
            const nft_asset = nft.asset

            if(nft_asset.collection){

                if(nft_asset.collection.address.toString() == collection){

                    listing_info.push(nft_asset)

                }
            }

        }

        console.log(listing_info)
    }

    const doList = async (nftIndex) => {

        try {

            const ix = await List(nftIndex.address,wallet,metaplex,0.2*1000000000)
            const receipt_ix = await Print_list_receipt(nftIndex.address,wallet,metaplex,0.2*1000000000)

            let tx = new Transaction();
            tx.add(ix).add(receipt_ix)
            tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash

            tx.feePayer = feepayer_value

            metaplex.rpc().sendAndConfirmTransaction(tx, {skipPreflight:false}, [metaplex.identity()])

            console.log(tx)

        } catch(error) {

            console.log(error)

        }
    }

    const find_nft = async () => {

        const all_nfts = await metaplex.nfts().findAllByOwner({owner: wallet.publicKey})
    
        for (const nft of all_nfts){
    
                if(nft.collection){
    
                    if(nft.collection.address.toString() == collection ){
    
                        const nft_ata = getAssociatedTokenAddressSync(nft.mintAddress, wallet.publicKey)
                        const nft_info = await metaplex.nfts().findByToken({token: nft_ata})
    
                        //for finding delegate
                        const nft_delegate = await getAccount(connection, nft_ata)
    
                        nfts_info.push(nft_info)
                        delegate.push(nft_delegate.delegate)
    
                    }
                }
            }
        const images = nfts_info//.map(nft => nft.json.image);
        setNftImages(images);

        console.log(images)
    }

    if (!wallet.connected) {
        return null;
    }else {
        checkEligibility();
    }

    return (
        <div>
            <div className={styles.container}>
                <div className={styles.nftForm}>
                    <button onClick={find_nft}>find listing</button>
                </div>
            </div>
            <div className="image-container">
                {nftImages.map((image, index) => (
                    <div key={index} className="image-card">
                        <img src={image.json.image} alt={image.name} width="170" height="170" />
                        <p>{image.name}</p>
                    </div>
                ))}
            </div>
            <style jsx>
                {`
                    .image-container {
                        display: flex; /* Use flexbox to align items in a row */
                        flex-wrap: wrap; /* Allow items to wrap to next line if space is limited */
                    }
    
                    .image-card {
                        margin-right: 20px; /* Add margin between image and text */
                        display: flex; /* Display image and text in a row */
                        flex-direction: column; /* Stack image and text vertically */
                        align-items: center; /* Center items horizontally */
                    }
                `}
            </style>
        </div>
    );
}