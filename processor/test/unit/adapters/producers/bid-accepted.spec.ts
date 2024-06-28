import { bidAcceptedProducer } from '../../../../src/adapters/producers/bid-accepted'
import { createConfigComponent } from '@well-known-components/env-config-provider'

describe('bid accepted producer', () => {
  test('should work when some new bid found', async () => {
    const config = createConfigComponent({
      MARKETPLACE_BASE_URL: 'https://marketplace-url'
    })
    const l2CollectionsSubGraph = {
      query: jest.fn()
    }
    l2CollectionsSubGraph.query.mockReturnValue({
      bids: [
        {
          id: '0x5d670bab052f21c3b1984231b1187be34852db24-105312291668557186697918027683670432318895095400549111254310977537-0x24e5f44999c151f08609f8e27b2238c773c4d020',
          seller: '0xb2a01607d2c1a36027cf7f37cb765ea010ff6300',
          bidder: '0x24e5f44999c151f08609f8e27b2238c773c4d020',
          status: 'sold',
          nft: {
            id: '0x5d670bab052f21c3b1984231b1187be34852db24-105312291668557186697918027683670432318895095400549111254310977537',
            category: 'wearable',
            image:
              'https://testnet-peer.memetaverse.club/lambdas/collections/contents/urn:memetaverse:mumbai:collections-v2:0x5d670bab052f21c3b1984231b1187be34852db24:1/thumbnail',
            metadata: {
              id: '0x5d670bab052f21c3b1984231b1187be34852db24-1',
              wearable: {
                id: '0x5d670bab052f21c3b1984231b1187be34852db24-1',
                name: 'Smart Wearable Example II',
                description: 'Put the glasses to see a new world',
                rarity: 'mythic'
              },
              emote: null
            },
            contractAddress: '0x5d670bab052f21c3b1984231b1187be34852db24',
            tokenId: '105312291668557186697918027683670432318895095400549111254310977537'
          },
          createdAt: '1701367617',
          updatedAt: '1701379983',
          blockchainId: '0x840df86c97afbeca305f1aa4009496abb48f2a58bf037ee6aaae2d6bd64511dc',
          price: '20000000000000000000'
        }
      ]
    })

    const producer = await bidAcceptedProducer({ config, l2CollectionsSubGraph })
    let result = await producer.run(Date.now())
    expect(result).toMatchObject({
      notificationType: 'bid_accepted',
      records: [
        {
          type: 'bid_accepted',
          address: '0x24e5f44999c151f08609f8e27b2238c773c4d020',
          eventKey: '0x840df86c97afbeca305f1aa4009496abb48f2a58bf037ee6aaae2d6bd64511dc',
          metadata: {
            category: 'wearable',
            description: 'Your bid for 20.00 MANA for this Smart Wearable Example II was accepted.',
            image:
              'https://testnet-peer.memetaverse.club/lambdas/collections/contents/urn:memetaverse:mumbai:collections-v2:0x5d670bab052f21c3b1984231b1187be34852db24:1/thumbnail',
            link: 'https://marketplace-url/contracts/0x5d670bab052f21c3b1984231b1187be34852db24/tokens/105312291668557186697918027683670432318895095400549111254310977537',
            network: 'polygon',
            nftName: 'Smart Wearable Example II',
            price: '20000000000000000000',
            rarity: 'mythic',
            seller: '0xb2a01607d2c1a36027cf7f37cb765ea010ff6300',
            title: 'Bid Accepted'
          },
          timestamp: 1701379983000
        }
      ],
      lastRun: expect.anything()
    })
  })

  test('should work when no new bids', async () => {
    const config = createConfigComponent({
      MARKETPLACE_BASE_URL: 'https://marketplace-url'
    })
    const l2CollectionsSubGraph = {
      query: jest.fn()
    }
    l2CollectionsSubGraph.query.mockReturnValue({
      bids: []
    })

    const producer = await bidAcceptedProducer({ config, l2CollectionsSubGraph })
    let result = await producer.run(Date.now())
    expect(result).toMatchObject({
      notificationType: 'bid_accepted',
      records: [],
      lastRun: expect.anything()
    })
  })
})
