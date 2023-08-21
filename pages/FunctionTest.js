import styles from '../styles/Home.module.css';
import { useState } from 'react';
import { Transaction, PublicKey } from '@solana/web3.js';
import { 
    Cancel_listing_receipt,
    Print_purchase_receipt,
    Print_list_receipt,
    Print_bid_receipt,
    cancel_bid,
    cancel_list,
    List,
    Bid,
    Execute, 
    Buy,
    Sell,
} from "./useAuction"
import bs58 from "bs58";
import { Metaplex, walletAdapterIdentity } from "@metaplex-foundation/js";
import { Keypair, Connection, clusterApiUrl } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';
import { PROGRAM_ADDRESS } from "@metaplex-foundation/mpl-auction-house";
export const Full_function = ({ onClusterChange }) => {

    const [nftImages, setNftImages] = useState([]);

    const wallet = useWallet();
    const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
    const metaplex = new Metaplex(connection);
    metaplex.use(walletAdapterIdentity(wallet))

    let TOKEN_METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s')
    let mintid = new PublicKey('9ZJKSGLMLoAkLX8zb4AA3yFfK2EGNb64UTX9qXEVVkMY')
    let seller = new PublicKey('2JeNLSrJkSaWoFoSQkb1YsxC1dXSaA1LTLjpakzb9SBf')
    let buyer = new PublicKey('Se9gzT3Ep3E452LPyYaWKYqcCvsAwtHhRQwQvmoXFxG')
    let listprice = 0.2*1000000000
    let bidprice = 0.2*1000000000
    let bs = bs58.decode("Bhao6w2hvn5LtBgJ6nAno3qTy6WMyn59k7sdbFdJVsRapumSJfF86hZ1wcWJ6SxuEhuJUwC2DoNu5YTA9DyMFSy");
    let ah_auth_wallet = Keypair.fromSecretKey(bs);

    const checkEligibility = async () => {

    };

    const doList = async () => {

        const ix = await List(mintid,wallet,metaplex,0.2*1000000000)
        const receipt_ix = await Print_list_receipt(mintid,wallet,metaplex,0.2*1000000000)

        let tx = new Transaction();
        tx.add(ix).add(receipt_ix)
        tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash

        metaplex.rpc().sendAndConfirmTransaction(tx, {skipPreflight:false}, [metaplex.identity()])

        console.log(tx)
    }
    const doBid = async () => {
        const ix = await Bid(mintid, wallet, metaplex, seller, bidprice)
        const receipt_ix = await Print_bid_receipt(mintid, wallet, metaplex, seller, bidprice)

        let tx = new Transaction();
        tx.add(ix).add(receipt_ix)
        tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash

        metaplex.rpc().sendAndConfirmTransaction(tx, {skipPreflight:false}, [ah_auth_wallet])
    }
    const doSell = async () => {

        const ixs = await Sell(mintid, wallet, metaplex, listprice, buyer)
        //const receipt_ix = await Print_purchase_receipt(mintid, wallet, seller, metaplex, listprice)

        let tx = new Transaction();
        for(const ix of ixs){
            tx.add(ix)
        }
        //tx.add(receipt_ix)
        tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash

        metaplex.rpc().sendAndConfirmTransaction(tx, {skipPreflight:false}, [ah_auth_wallet])
        console.log(ixs)
    }
    const doBuy = async () => {

        const ixs = await Buy(mintid, wallet, metaplex, seller, listprice, metaplex.identity().publicKey)
        const receipt_ix = await Print_purchase_receipt(mintid, wallet, seller, metaplex, listprice)

        const tx = new Transaction();
        for(const ix of ixs){
            tx.add(ix)
        }
        //tx.add(receipt_ix)
        tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash

        console.log(tx)
        metaplex.rpc().sendAndConfirmTransaction(tx, {skipPreflight:false}, [metaplex.identity().publicKey])
    }
    const doCancellist = async () => {

        const [metadata,metadata_bump] = PublicKey.findProgramAddressSync(
            [
                Buffer.from('metadata'),
                TOKEN_METADATA_PROGRAM_ID.toBuffer(),
                mintid.toBuffer(),
            ],
            TOKEN_METADATA_PROGRAM_ID,
        );

        const auctionHouse = await metaplex
        .auctionHouse()
        .findByAddress({ address: new PublicKey("DYJGVipuxyXpJoPqzFLq44e5xJWRzao6qu12TTioAMWq") });
        const listing = await metaplex
        .auctionHouse()
        .findListings({ auctionHouse, seller, metadata });

        const cancel_tx = await cancel_list(mintid, wallet, metaplex, listing[0].receiptAddress)
        const cancellistreceipt_ix = await Cancel_listing_receipt(mintid, wallet, metaplex, listprice)

        metaplex.rpc().sendAndConfirmTransaction(cancel_tx, {skipPreflight:false}, [metaplex.identity()])

        // const tx = new Transaction();
        // tx.add(cancellistreceipt_ix)
        // tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash
        //metaplex.rpc().sendAndConfirmTransaction(tx, {skipPreflight:false}, [metaplex.identity()])
        console.log(cancel_tx)
        console.log(cancellistreceipt_ix)
    }


    const doCancelbid = async () => {
        const ix = await cancel_bid(mintid, metaplex)
    }
    const find_escrow = async ()=> {

        const auctionHouse = await metaplex
        .auctionHouse()
        .findByAddress({ address: new PublicKey("DYJGVipuxyXpJoPqzFLq44e5xJWRzao6qu12TTioAMWq") });

        const escrowPaymentAccount = PublicKey.findProgramAddressSync(
            [
                Buffer.from('auction_house'),
                (await auctionHouse).address.toBuffer(),
                wallet.publicKey.toBuffer(),
            ],
            new PublicKey(PROGRAM_ADDRESS)
        )
        console.log(escrowPaymentAccount)
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
                    <button onClick={doList}>list</button>
                    <button onClick={doBid}>bid</button>
                    <button onClick={doBuy}>buy</button>
                    <button onClick={doSell}>sell</button>
                    <button onClick={doCancellist}>cancel list</button>
                    <button onClick={find_escrow}>escrow</button>

                </div>
            </div>
        </div>
    );
}