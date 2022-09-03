import { ethers } from "ethers"
import { Button, Form, useNotification } from "web3uikit"
import styles from "../styles/Home.module.css"
import nftAbi from "../constants/BasicNft.json"
import { useMoralis, useWeb3Contract } from "react-moralis"
import networkMapping from "../constants/networkMapping.json"
import marketplaceAbi from "../constants/NftMarketplace.json"
import { useEffect, useState } from "react"

export default function SellNft() {
   const { chainId, account, isWeb3Enabled } = useMoralis()
   const chainString = chainId ? parseInt(chainId).toString() : "31337"
   const marketplaceAddress = networkMapping[chainString].NftMarketplace
   const dispatch = useNotification()
   const { runContractFunction } = useWeb3Contract()
   const [proceeds, setProceeds] = useState("0")
   async function approveAndList(...data) {
      data = JSON.parse(JSON.stringify(data[0].data))
      const nftAddress = data[0].inputResult
      const tokenId = data[1].inputResult
      const price = ethers.utils
         .parseEther(data[2].inputResult, "ether")
         .toString()
      const approveOptions = {
         abi: nftAbi,
         contractAddress: nftAddress,
         functionName: "approve",
         params: { to: marketplaceAddress, tokenId: tokenId },
      }
      await runContractFunction({
         params: approveOptions,
         onSuccess: () => {
            handleApproveSuccess(nftAddress, price, tokenId)
         },
         onError: (error) => console.error(error),
      })
   }
   async function handleApproveSuccess(nftAddress, price, tokenId) {
      console.log("OK! Now time to list")
      const listOption = {
         abi: marketplaceAbi,
         contractAddress: marketplaceAddress,
         functionName: "listItem",
         params: {
            nftAddress: nftAddress,
            tokenId: tokenId,
            price: price,
         },
      }
      await runContractFunction({
         params: listOption,
         onSuccess: handleListSuccess,
         onError: (error) => console.error(error),
      })
   }
   async function handleListSuccess(tx) {
      await tx.wait(1)
      dispatch({
         type: "success",
         message: "NFT Listing",
         title: "NFT Listed",
         position: "topR",
      })
   }
   async function setupUI() {
      const returnedProceeds = await runContractFunction({
         params: {
            abi: marketplaceAbi,
            contractAddress: marketplaceAddress,
            functionName: "getProceeds",
            params: {
               seller: account,
            },
         },
         onError: (error) => console.log(error),
      })
      if (returnedProceeds) {
         setProceeds(returnedProceeds.toString())
      }
   }
   const handleWithdrawSuccess = async (tx) => {
      await tx.wait(1)
      dispatch({
         type: "success",
         message: "Withdrawing proceeds",
         position: "topR",
      })
   }

   useEffect(() => {
      if (isWeb3Enabled) {
         setupUI()
      }
   }, [proceeds, account, isWeb3Enabled, chainId])

   return (
      <div className="container m-4 px-5 font-bold">
         <h1 className="text-3xl">Sell Your NFT</h1>
         <div className="m-3 mx-5">
            <Form
               onSubmit={approveAndList}
               title="Sell your NFT!"
               id="Main Form"
               key="SellingNFT"
               data={[
                  {
                     name: "NFT Address",
                     type: "text",
                     inputWidth: "50%",
                     value: "",
                     key: "nftAddress",
                  },
                  {
                     name: "Token Id",
                     type: "number",
                     value: "",
                     key: "tokenId",
                  },
                  {
                     name: "Price (in ETH)",
                     type: "number",
                     value: "",
                     key: "price",
                  },
               ]}
            ></Form>
         </div>
         <div className="text-2xl">
            Withdraw {ethers.utils.formatEther(proceeds)} ETH proceeds
         </div>
         {proceeds != "0" ? (
            <div className="m-5">
               <Button
                  color="green"
                  theme="primary"
                  size="large"
                  onClick={() => {
                     runContractFunction({
                        params: {
                           abi: marketplaceAbi,
                           contractAddress: marketplaceAddress,
                           functionName: "withdrawProceeds",
                           params: {},
                        },
                        onError: (error) => console.log(error),
                        onSuccess: handleWithdrawSuccess,
                     })
                  }}
                  text="Withdraw"
                  type="button"
               />
            </div>
         ) : (
            <div>No proceeds detected</div>
         )}
      </div>
   )
}
