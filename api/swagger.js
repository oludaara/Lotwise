const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Lotwise API',
      version: '2.0.0',
      description: 'Advanced Fractional Real Estate Platform API with Aave Integration',
      contact: {
        name: 'Lotwise Team',
        email: 'api@lotwise.io',
        url: 'https://lotwise.io'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server'
      },
      {
        url: 'https://api.lotwise.io',
        description: 'Production server'
      }
    ],
    tags: [
      {
        name: 'Health',
        description: 'System health and status endpoints'
      },
      {
        name: 'Properties',
        description: 'Property management and information'
      },
      {
        name: 'Users',
        description: 'User profiles and portfolio management'
      },
      {
        name: 'Aave',
        description: 'Aave protocol integration for lending and borrowing'
      },
      {
        name: 'Yield',
        description: 'Yield distribution and claiming'
      },
      {
        name: 'Marketplace',
        description: 'Token trading marketplace'
      },
      {
        name: 'Cross-Chain',
        description: 'Cross-chain transfer operations'
      },
      {
        name: 'Analytics',
        description: 'Platform analytics and statistics'
      },
      {
        name: 'Prices',
        description: 'Price feeds and market data'
      },
      {
        name: 'Liquidation',
        description: 'Liquidation monitoring and management'
      }
    ],
    components: {
      schemas: {
        Property: {
          type: 'object',
          required: ['id', 'address', 'totalValue', 'tokenPrice', 'totalTokens'],
          properties: {
            id: {
              type: 'string',
              description: 'Unique property identifier',
              example: 'PROP-001'
            },
            address: {
              type: 'string',
              description: 'Physical address of the property',
              example: '123 Main St, San Francisco, CA'
            },
            totalValue: {
              type: 'number',
              description: 'Total property value in USD',
              example: 1000000
            },
            tokenPrice: {
              type: 'number',
              description: 'Price per token in USD',
              example: 1000
            },
            totalTokens: {
              type: 'number',
              description: 'Total number of tokens for this property',
              example: 1000
            },
            mintedTokens: {
              type: 'number',
              description: 'Number of tokens currently minted',
              example: 450
            },
            description: {
              type: 'string',
              description: 'Property description',
              example: 'Luxury downtown apartment building'
            },
            imageUrl: {
              type: 'string',
              format: 'uri',
              description: 'Property image URL',
              example: 'https://example.com/property1.jpg'
            },
            yearBuilt: {
              type: 'number',
              description: 'Year the property was built',
              example: 2018
            },
            squareFeet: {
              type: 'number',
              description: 'Property size in square feet',
              example: 50000
            },
            propertyType: {
              type: 'string',
              description: 'Type of property',
              enum: ['Single-Family', 'Multi-Family', 'Condominium', 'Commercial', 'Mixed-Use'],
              example: 'Multi-Family'
            },
            neighborhood: {
              type: 'string',
              description: 'Property neighborhood',
              example: 'SOMA'
            },
            amenities: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Property amenities',
              example: ['Gym', 'Rooftop', 'Parking', 'Concierge']
            },
            coordinates: {
              type: 'object',
              properties: {
                lat: {
                  type: 'number',
                  description: 'Latitude',
                  example: 37.7749
                },
                lng: {
                  type: 'number',
                  description: 'Longitude',
                  example: -122.4194
                }
              }
            },
            verified: {
              type: 'boolean',
              description: 'Whether property is verified',
              example: true
            },
            aaveStats: {
              $ref: '#/components/schemas/PropertyAaveStats'
            },
            owners: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/PropertyOwner'
              }
            }
          }
        },
        PropertyAaveStats: {
          type: 'object',
          properties: {
            totalSupplied: {
              type: 'number',
              description: 'Total amount supplied to Aave for this property',
              example: 150000
            },
            totalBorrowed: {
              type: 'number',
              description: 'Total amount borrowed against this property',
              example: 100000
            },
            averageAPY: {
              type: 'number',
              description: 'Average annual percentage yield',
              example: 5.2
            },
            totalYieldDistributed: {
              type: 'number',
              description: 'Total yield distributed to token holders',
              example: 7500
            }
          }
        },
        PropertyOwner: {
          type: 'object',
          properties: {
            address: {
              type: 'string',
              pattern: '^0x[a-fA-F0-9]{40}$',
              description: 'Ethereum address of the owner',
              example: '0x1234567890abcdef1234567890abcdef12345678'
            },
            tokens: {
              type: 'number',
              description: 'Number of tokens owned',
              example: 50
            },
            percentage: {
              type: 'number',
              description: 'Ownership percentage',
              example: 5.0
            }
          }
        },
        User: {
          type: 'object',
          required: ['address'],
          properties: {
            address: {
              type: 'string',
              pattern: '^0x[a-fA-F0-9]{40}$',
              description: 'Ethereum address of the user',
              example: '0x1234567890abcdef1234567890abcdef12345678'
            },
            totalTokens: {
              type: 'number',
              description: 'Total number of property tokens owned',
              example: 75
            },
            portfolioValue: {
              type: 'number',
              description: 'Total portfolio value in USD',
              example: 175000
            },
            totalSuppliedToAave: {
              type: 'number',
              description: 'Total amount supplied to Aave as collateral',
              example: 50000
            },
            totalBorrowedFromAave: {
              type: 'number',
              description: 'Total amount borrowed from Aave',
              example: 30000
            },
            healthFactor: {
              type: 'number',
              minimum: 0,
              maximum: 100,
              description: 'Health factor for liquidation risk (0-100)',
              example: 85
            },
            claimableYield: {
              type: 'number',
              description: 'Total claimable yield across all properties',
              example: 1250
            },
            properties: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'List of property IDs owned by user',
              example: ['PROP-001', 'PROP-002']
            }
          }
        },
        UserPortfolio: {
          type: 'object',
          properties: {
            address: {
              type: 'string',
              pattern: '^0x[a-fA-F0-9]{40}$',
              description: 'User address',
              example: '0x1234567890abcdef1234567890abcdef12345678'
            },
            totalTokens: {
              type: 'number',
              description: 'Total tokens owned',
              example: 75
            },
            portfolioValue: {
              type: 'number',
              description: 'Total portfolio value in USD',
              example: 175000
            },
            properties: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Property'
              }
            },
            aavePosition: {
              $ref: '#/components/schemas/AavePosition'
            },
            claimableYield: {
              type: 'number',
              description: 'Total claimable yield',
              example: 1250
            }
          }
        },
        AavePosition: {
          type: 'object',
          properties: {
            address: {
              type: 'string',
              pattern: '^0x[a-fA-F0-9]{40}$',
              description: 'User address',
              example: '0x1234567890abcdef1234567890abcdef12345678'
            },
            suppliedAmount: {
              type: 'number',
              description: 'Total amount supplied as collateral',
              example: 50000
            },
            borrowedAmount: {
              type: 'number',
              description: 'Total amount borrowed',
              example: 30000
            },
            healthFactor: {
              type: 'number',
              minimum: 0,
              maximum: 100,
              description: 'Position health factor',
              example: 85
            },
            maxBorrowable: {
              type: 'number',
              description: 'Maximum amount that can be borrowed',
              example: 37500
            },
            liquidationThreshold: {
              type: 'number',
              description: 'Liquidation threshold amount',
              example: 40000
            },
            isCollateralized: {
              type: 'boolean',
              description: 'Whether user has collateral supplied',
              example: true
            },
            currentAPY: {
              type: 'number',
              description: 'Current annual percentage yield',
              example: 5.2
            }
          }
        },
        YieldInfo: {
          type: 'object',
          properties: {
            propertyId: {
              type: 'string',
              description: 'Property identifier',
              example: 'PROP-001'
            },
            totalYieldPool: {
              type: 'number',
              description: 'Total yield pool for the property',
              example: 7500
            },
            currentAPY: {
              type: 'number',
              description: 'Current annual percentage yield',
              example: 5.2
            },
            nextDistribution: {
              type: 'string',
              format: 'date-time',
              description: 'Next yield distribution date',
              example: '2025-06-23T20:00:00.000Z'
            },
            totalOwners: {
              type: 'number',
              description: 'Total number of token owners',
              example: 3
            },
            averageYieldPerToken: {
              type: 'number',
              description: 'Average yield per token',
              example: 16.67
            }
          }
        },
        UserYieldInfo: {
          type: 'object',
          properties: {
            propertyId: {
              type: 'string',
              description: 'Property identifier',
              example: 'PROP-001'
            },
            userAddress: {
              type: 'string',
              pattern: '^0x[a-fA-F0-9]{40}$',
              description: 'User address',
              example: '0x1234567890abcdef1234567890abcdef12345678'
            },
            tokensOwned: {
              type: 'number',
              description: 'Number of tokens owned by user',
              example: 50
            },
            ownershipPercentage: {
              type: 'number',
              description: 'Ownership percentage',
              example: 5.0
            },
            claimableYield: {
              type: 'number',
              description: 'Currently claimable yield',
              example: 125
            },
            totalYieldEarned: {
              type: 'number',
              description: 'Total yield earned to date',
              example: 250
            },
            lastClaimed: {
              type: 'string',
              format: 'date-time',
              description: 'Last yield claim date',
              example: '2025-06-15T20:17:10.197Z'
            }
          }
        },
        MarketplaceListing: {
          type: 'object',
          properties: {
            id: {
              type: 'number',
              description: 'Listing identifier',
              example: 1
            },
            tokenId: {
              type: 'number',
              description: 'Token identifier being sold',
              example: 123
            },
            propertyId: {
              type: 'string',
              description: 'Property identifier',
              example: 'PROP-001'
            },
            price: {
              type: 'number',
              description: 'Listing price in USD',
              example: 1050
            },
            seller: {
              type: 'string',
              description: 'Seller address (truncated for display)',
              example: '0x1234...abcd'
            },
            listedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Listing creation date',
              example: '2024-01-15T10:30:00Z'
            },
            active: {
              type: 'boolean',
              description: 'Whether listing is active',
              example: true
            }
          }
        },
        PriceData: {
          type: 'object',
          properties: {
            symbol: {
              type: 'string',
              description: 'Asset symbol',
              example: 'ETH'
            },
            usd: {
              type: 'number',
              description: 'Price in USD',
              example: 2000
            },
            lastUpdated: {
              type: 'string',
              format: 'date-time',
              description: 'Last price update',
              example: '2025-06-22T20:00:00.000Z'
            }
          }
        },
        HealthStatus: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['healthy', 'degraded', 'unhealthy'],
              description: 'Overall system health',
              example: 'healthy'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Health check timestamp',
              example: '2025-06-22T20:00:00.000Z'
            },
            version: {
              type: 'string',
              description: 'API version',
              example: '2.0.0'
            },
            features: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Available features',
              example: ['Fractional Ownership', 'Aave Integration', 'Cross-chain Support']
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
              example: 'Resource not found'
            },
            code: {
              type: 'string',
              description: 'Error code',
              example: 'NOT_FOUND'
            },
            details: {
              type: 'object',
              description: 'Additional error details'
            }
          }
        },
        SupplyRequest: {
          type: 'object',
          required: ['tokenIds', 'userAddress'],
          properties: {
            tokenIds: {
              type: 'array',
              items: {
                type: 'number'
              },
              description: 'Array of token IDs to supply as collateral',
              example: [1, 2, 3, 4, 5]
            },
            userAddress: {
              type: 'string',
              pattern: '^0x[a-fA-F0-9]{40}$',
              description: 'User address',
              example: '0x1234567890abcdef1234567890abcdef12345678'
            }
          }
        },
        BorrowRequest: {
          type: 'object',
          required: ['amount', 'asset', 'userAddress'],
          properties: {
            amount: {
              type: 'string',
              description: 'Amount to borrow (in USD)',
              example: '1000'
            },
            asset: {
              type: 'string',
              description: 'Asset to borrow',
              enum: ['USDC', 'USDT', 'DAI', 'ETH'],
              example: 'USDC'
            },
            userAddress: {
              type: 'string',
              pattern: '^0x[a-fA-F0-9]{40}$',
              description: 'User address',
              example: '0x1234567890abcdef1234567890abcdef12345678'
            }
          }
        },
        RepayRequest: {
          type: 'object',
          required: ['amount', 'asset', 'userAddress'],
          properties: {
            amount: {
              type: 'string',
              description: 'Amount to repay (in USD)',
              example: '500'
            },
            asset: {
              type: 'string',
              description: 'Asset to repay',
              enum: ['USDC', 'USDT', 'DAI', 'ETH'],
              example: 'USDC'
            },
            userAddress: {
              type: 'string',
              pattern: '^0x[a-fA-F0-9]{40}$',
              description: 'User address',
              example: '0x1234567890abcdef1234567890abcdef12345678'
            }
          }
        },
        WithdrawRequest: {
          type: 'object',
          required: ['tokenIds', 'userAddress'],
          properties: {
            tokenIds: {
              type: 'array',
              items: {
                type: 'number'
              },
              description: 'Array of token IDs to withdraw from collateral',
              example: [1, 2]
            },
            userAddress: {
              type: 'string',
              pattern: '^0x[a-fA-F0-9]{40}$',
              description: 'User address',
              example: '0x1234567890abcdef1234567890abcdef12345678'
            }
          }
        },
        ClaimYieldRequest: {
          type: 'object',
          required: ['propertyId', 'userAddress'],
          properties: {
            propertyId: {
              type: 'string',
              description: 'Property identifier',
              example: 'PROP-001'
            },
            userAddress: {
              type: 'string',
              pattern: '^0x[a-fA-F0-9]{40}$',
              description: 'User address',
              example: '0x1234567890abcdef1234567890abcdef12345678'
            }
          }
        }
      },
      responses: {
        BadRequest: {
          description: 'Bad request - Invalid input parameters',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        NotFound: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        InternalServerError: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        }
      }
    }
  },
  apis: ['./server.js'], // Path to the API docs
};

module.exports = swaggerJsdoc(options);
