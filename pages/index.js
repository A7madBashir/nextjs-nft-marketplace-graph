import NftBox from "../components/NftBox"
import { useMoralis } from "react-moralis"
import { useQuery } from "@apollo/client/"
import networkMapping from "../constants/networkMapping.json"
import GET_ACTIVE_QUERY from "../constants/subgraphQueries"

export default function Home() {
   const { isWeb3Enabled, chainId } = useMoralis()
   const chainString = chainId ? parseInt(chainId).toString() : "31337"
   const marketplaceAddress = networkMapping[chainString]["NftMarketplace"]
   const { loading, error, data: listedNfts } = useQuery(GET_ACTIVE_QUERY)
   return (
      <div className="container mx-auto ">
         <h1 className="py-4 px-4 font-bold text-2xl">Recently Listed</h1>
         <div className="flex flex-wrap m-5 p-5">
            {isWeb3Enabled ? (
               !listedNfts ? (
                  <div>Loading...</div>
               ) : (
                  listedNfts.activeItems.map((nft) => {
                     console.log(nft)
                     const { tokenId, nftAddress, seller, price } = nft
                     return (
                        <NftBox
                           price={price}
                           nftAddress={nftAddress}
                           tokenId={tokenId}
                           marketplaceAddress={marketplaceAddress}
                           seller={seller}
                           key={`${nftAddress}${tokenId}`}
                        />
                     )
                  })
               )
            ) : (
               <h1>Please Connect Wallet</h1>
            )}
         </div>
      </div>
   )
}
