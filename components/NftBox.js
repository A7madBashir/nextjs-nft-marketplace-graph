import React, { useEffect, useState } from "react"
import { useWeb3Contract, useMoralis } from "react-moralis"
import NftMarketplaceAbi from "../constants/NftMarketplace.json"
import nftAbi from "../constants/BasicNft.json"
import Image from "next/dist/client/image"
import { Card, useNotification } from "web3uikit"
import { ethers } from "ethers"
import UpdateListingModel from "./updateListingModel"
const truncateStr = (fullStr, strLng) => {
   if (fullStr.length <= strLng) return fullStr

   const separator = "..."
   const separatorLength = separator.length
   const charsToShow = strLng - separatorLength
   const frontChars = Math.ceil(charsToShow / 2)
   const backChars = Math.floor(charsToShow / 2)
   return (
      fullStr.substring(0, frontChars) +
      separator +
      fullStr.substring(fullStr.length - backChars)
   )
}
function NftBox({ price, nftAddress, seller, tokenId, marketplaceAddress }) {
   const { isWeb3Enabled, account } = useMoralis()
   const [imageUri, setImageUri] = useState("")
   const [tokenName, setTokenName] = useState("")
   const [tokenDescription, setTokenDescription] = useState("")
   // const [nftPrice, setNftPrice] = useState(0)
   const [showModal, setShowModal] = useState(false)
   const hideModal = () => setShowModal(false)
   const dispatch = useNotification()

   const { runContractFunction: getTokenURI } = useWeb3Contract({
      abi: nftAbi,
      contractAddress: nftAddress,
      functionName: "tokenURI",
      params: { tokenId: tokenId },
   })
   const { runContractFunction: buyNft } = useWeb3Contract({
      abi: NftMarketplaceAbi,
      contractAddress: marketplaceAddress,
      functionName: "buyItem",
      msgValue: price,
      params: {
         nftAddress: nftAddress,
         tokenId: tokenId,
      },
   })

   async function updateUI() {
      const tokenUri = await getTokenURI()
      if (tokenUri) {
         const requestUrl = tokenUri.replace("ipfs://", "https://ipfs.io/ipfs/")
         const tokenUriResponse = await (await fetch(requestUrl)).json()
         const imageUri = tokenUriResponse.image
         const imageURIURL = imageUri.replace("ipfs://", "https://ipfs.io/ipfs")
         setImageUri(imageURIURL)
         setTokenName(tokenUriResponse.name)
         setTokenDescription(tokenUriResponse.describtion)
         console.log(`New Price ${price}`)
         // setNftPrice(price)
      }
   }

   useEffect(() => {
      if (isWeb3Enabled) {
         updateUI()
      }
   }, [isWeb3Enabled])

   const isOwnedByUser = seller === account || seller === undefined
   const formattedSellerAdderss = isOwnedByUser
      ? "you"
      : truncateStr(seller || "", 11)

   function handleCardClick() {
      isOwnedByUser
         ? setShowModal(true)
         : buyNft({
              onSuccess: handleBuyItemSuccess,
              onError: (error) => {
                 console.error(error)
              },
           })
   }
   const handleBuyItemSuccess = async (tx) => {
      console.log("Success!")
      await tx.wait(1)
      dispatch({
         type: "success",
         message: "NFT Bought!",
         title: "NFT Bought",
         position: "topR",
      })
   }
   return (
      <div>
         <div className="mx-3">
            {imageUri ? (
               <>
                  <UpdateListingModel
                     isVisible={showModal}
                     tokenId={tokenId}
                     nftAddress={nftAddress}
                     nftMarketPlaceAddress={marketplaceAddress}
                     onClose={hideModal}
                  />
                  <Card
                     title={tokenName}
                     description={tokenDescription}
                     onClick={handleCardClick}
                  >
                     <div className="p-2">
                        <div className="flex flex-col items-end gap-2">
                           <div>#{tokenId}</div>
                           <div className="italic text-sm self-start">
                              Owned By {formattedSellerAdderss}
                           </div>
                           <div className="self-center">
                              <Image
                                 alt="NFT"
                                 loader={() => imageUri}
                                 src={imageUri}
                                 height="200"
                                 width="200"
                                 className="text-center"
                              />
                           </div>
                           <div className="font-bold self-end">
                              {ethers.utils.formatUnits(price, "ether")}ETH
                           </div>
                        </div>
                     </div>
                  </Card>
               </>
            ) : (
               <p>Loading..</p>
            )}
         </div>
      </div>
   )
}
export default NftBox
