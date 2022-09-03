import { useState } from "react"
import { Modal, Input, useNotification } from "web3uikit"
import { useWeb3Contract } from "react-moralis"
import NftMarketPlace from "../constants/NftMarketplace.json"
import { ethers } from "ethers"

export default function UpdateListingModel({
   nftAddress,
   nftMarketPlaceAddress,
   tokenId,
   isVisible,
   onClose,
}) {
   const [priceToUpdateListing, setPriceToUpdateListing] = useState(0)
   const dispatch = useNotification()
   const handleUpdateListingSuccess = async (tx) => {
      await tx.wait(1)
      dispatch({
         type: "success",
         message: "Listing Updated",
         title: "Listing Updated",
         position: "topR",
      })
      onClose && onClose()
      await setTimeout(() => updateUI(), 4000)
      setPriceToUpdateListing("0")
   }
   const { runContractFunction: UpdateListing } = useWeb3Contract({
      abi: NftMarketPlace,
      contractAddress: nftMarketPlaceAddress,
      functionName: "updateListing",
      params: {
         nftAddress: nftAddress,
         tokenId: tokenId,
         newPrice: ethers.utils.parseEther(priceToUpdateListing || "0"),
      },
   })
   return (
      <Modal
         isVisible={isVisible}
         onCancel={onClose}
         onCloseButtonPressed={onClose}
         onOk={() => {
            UpdateListing({
               onError(error) {
                  console.error(error)
               },
               onSuccess: handleUpdateListingSuccess,
            })
         }}
      >
         <Input
            label="Update Listing price in L1 Currency (ETH)"
            name="New Listing Price"
            type="number"
            onChange={(event) => {
               setPriceToUpdateListing(event.target.value)
            }}
         />
      </Modal>
   )
}
