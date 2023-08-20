import styles from '../styles/Home.module.css';
import { useState } from 'react';
import { Keypair, Transaction, PublicKey, ComputeBudgetProgram } from '@solana/web3.js';
import { getAssociatedTokenAddressSync, getAccount , getMint, NATIVE_MINT} from "@solana/spl-token";
import { List, Bid, Execute, Buy, Sell, Print_list_receipt } from "./useAuction"
import bs58 from "bs58";
import { Metaplex ,  isMetaplexFile,  keypairIdentity,  lamports,toLazyBid,walletAdapterIdentity } from "@metaplex-foundation/js";
import { Connection, clusterApiUrl, SystemProgram } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';

export const Show_Listing = ({ onClusterChange }) => {

    const wallet = useWallet();
    const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
    const metaplex = new Metaplex(connection);

    let bs = bs58.decode("Bhao6w2hvn5LtBgJ6nAno3qTy6WMyn59k7sdbFdJVsRapumSJfF86hZ1wcWJ6SxuEhuJUwC2DoNu5YTA9DyMFSy");
    let ah_auth_wallet = Keypair.fromSecretKey(bs);

    let nfts_info = []

    const checkEligibility = async () => {
        //await find_nft();
    };

    const find_nft = async () => {

        let nfts_asset = null;

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

                if(nft_asset.collection.address.toString() == "JBKb1iCjzS3AuUKYJyt83hZNCvYyd5cEGmpqLZRqKPbj"){

                    nfts_info.push(nft_asset)

                }
            }

        }

        console.log(nfts_info)
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
              <button onClick={find_nft}>find listing</button>
              </div>
            </div>
          </div>
        </div>
      );
}