import { AppComponents, INotificationGenerator } from '../../types'
import { formatMana } from '../../logic/utils'
import { NotificationType } from '@mtvproject/schemas'
import { NotificationRecord } from '@notifications/common'

export const PAGE_SIZE = 1000

const ROYALTIES_EARNED_QUERY = `
    query Sales($since: BigInt!, $paginationId: ID) {
      sales(
        where: {timestamp_gte: $since, royaltiesCut_not: "0", id_gt: $paginationId}
        orderBy: id
        orderDirection: asc
        first: ${PAGE_SIZE}
      ) {
        id
        type
        buyer
        seller
        royaltiesCut
        royaltiesCollector
        nft {
          id
          category
          image
          metadata {
            id
            wearable {
              id
              name
              description
              rarity
            }
            emote {
              id
              name
              description
              rarity
            }
          }
          contractAddress
          tokenId
        }
        searchContractAddress
        searchCategory
        price
        txHash
        timestamp
      }
    }
  `

type SalesResponse = {
  sales: {
    id: string
    type: string
    buyer: string
    seller: string
    royaltiesCut: string
    royaltiesCollector: string
    nft: {
      id: string
      category: 'wearable' | 'emote'
      image: string
      metadata: {
        id: string
        wearable?: {
          id: string
          name: string
          description: string
          rarity: string
        }
        emote?: {
          id: string
          name: string
          description: string
          rarity: string
        }
      }
      contractAddress: string
      tokenId: string
    }
    txHash: string
    timestamp: number
  }[]
}

const notificationType = NotificationType.ROYALTIES_EARNED

export async function royaltiesEarnedProducer(
  components: Pick<AppComponents, 'config' | 'l2CollectionsSubGraph'>
): Promise<INotificationGenerator> {
  const { config, l2CollectionsSubGraph } = components

  const marketplaceBaseUrl = await config.requireString('MARKETPLACE_BASE_URL')

  async function run(since: number) {
    const now = Date.now()
    const produced: NotificationRecord[] = []

    let result: SalesResponse
    let paginationId = ''
    do {
      result = await l2CollectionsSubGraph.query<SalesResponse>(ROYALTIES_EARNED_QUERY, {
        since: Math.floor(since / 1000),
        paginationId
      })

      if (result.sales.length === 0) {
        break
      }

      for (const sale of result.sales) {
        const notificationRecord = {
          type: notificationType,
          address: sale.royaltiesCollector,
          eventKey: sale.txHash,
          metadata: {
            image: sale.nft.image,
            category: sale.nft.category,
            rarity: sale.nft.metadata[sale.nft.category]?.rarity,
            link: `${marketplaceBaseUrl}/contracts/${sale.nft.contractAddress}/tokens/${sale.nft.tokenId}`,
            nftName: sale.nft.metadata[sale.nft.category]?.name,
            title: 'Royalties Earned',
            description: `You earned ${formatMana(sale.royaltiesCut)} MANA for this ${
              sale.nft.metadata[sale.nft.category]?.name
            }.`,
            royaltiesCut: sale.royaltiesCut,
            royaltiesCollector: sale.royaltiesCollector,
            network: 'polygon'
          },
          timestamp: sale.timestamp * 1000
        }
        produced.push(notificationRecord)

        paginationId = sale.id
      }
    } while (result.sales.length === PAGE_SIZE)

    return {
      notificationType: notificationType,
      records: produced,
      lastRun: now
    }
  }

  return {
    notificationType,
    run
  }
}
