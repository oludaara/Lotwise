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
      },
      {
        name: 'Authentication',
        description: 'Wallet-based authentication endpoints'
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
        },
        AuthNonceResponse: {
          type: 'object',
          properties: {
            nonce: {
              type: 'string',
              description: 'Random nonce to be signed by the wallet',
              example: '123456'
            },
            message: {
              type: 'string',
              description: 'Message to be signed',
              example: 'Welcome to Lotwise! Please sign this message to verify your wallet ownership. Nonce: 123456'
            }
          }
        },
        AuthVerifyRequest: {
          type: 'object',
          required: ['address', 'signature'],
          properties: {
            address: {
              type: 'string',
              pattern: '^0x[a-fA-F0-9]{40}$',
              description: 'Ethereum address of the user',
              example: '0x1234567890abcdef1234567890abcdef12345678'
            },
            signature: {
              type: 'string',
              description: 'Signed message signature',
              example: '0x...'
            }
          }
        },
        AuthResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Whether the authentication was successful',
              example: true
            },
            user: {
              $ref: '#/components/schemas/User'
            },
            token: {
              type: 'string',
              description: 'JWT token for subsequent authenticated requests',
              example: 'eyJhbGciOiJIUzI1NiIs...'
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
      },
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [
      {
        BearerAuth: []
      }
    ],
    paths: {
      '/health': {
        get: {
          summary: 'Health check endpoint',
          description: 'Returns the current health status of the API server and available features',
          tags: ['Health'],
          responses: {
            200: {
              description: 'Server is healthy',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/HealthStatus' }
                }
              }
            },
            500: { $ref: '#/components/responses/InternalServerError' }
          }
        }
      },
      '/api/properties': {
        get: {
          summary: 'Get all properties',
          description: 'Retrieve a list of all available properties in the platform',
          tags: ['Properties'],
          parameters: [
            {
              in: 'query',
              name: 'limit',
              schema: { type: 'integer', default: 10 },
              description: 'Maximum number of properties to return'
            },
            {
              in: 'query',
              name: 'offset',
              schema: { type: 'integer', default: 0 },
              description: 'Number of properties to skip'
            },
            {
              in: 'query',
              name: 'verified',
              schema: { type: 'boolean' },
              description: 'Filter by verification status'
            }
          ],
          responses: {
            200: {
              description: 'List of properties retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      properties: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Property' }
                      },
                      total: { type: 'number', example: 2 },
                      limit: { type: 'number', example: 10 },
                      offset: { type: 'number', example: 0 }
                    }
                  }
                }
              }
            },
            500: { $ref: '#/components/responses/InternalServerError' }
          }
        }
      },
      '/api/properties/{id}': {
        get: {
          summary: 'Get property by ID',
          description: 'Retrieve a property by its unique identifier',
          tags: ['Properties'],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'string' },
              description: 'Property ID'
            }
          ],
          responses: {
            200: {
              description: 'Property retrieved successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Property' }
                }
              }
            },
            404: { $ref: '#/components/responses/NotFound' },
            500: { $ref: '#/components/responses/InternalServerError' }
          }
        }
      },
      '/api/properties/{id}/verify': {
        post: {
          summary: 'Verify property',
          description: 'Verify a property by its ID',
          tags: ['Properties'],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'string' },
              description: 'Property ID'
            }
          ],
          responses: {
            200: {
              description: 'Property verified successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      verified: { type: 'boolean', example: true },
                      message: { type: 'string', example: 'Property verified successfully' },
                      valuation: { type: 'number', example: 1000000 }
                    }
                  }
                }
              }
            },
            404: { $ref: '#/components/responses/NotFound' },
            500: { $ref: '#/components/responses/InternalServerError' }
          }
        }
      },
      '/api/users/{address}': {
        get: {
          summary: 'Get user profile',
          description: 'Retrieve user profile information including token holdings and Aave positions',
          tags: ['Users'],
          parameters: [
            {
              in: 'path',
              name: 'address',
              required: true,
              schema: { type: 'string', pattern: '^0x[a-fA-F0-9]{40}$' },
              description: 'Ethereum address of the user',
              example: '0x1234567890abcdef1234567890abcdef12345678'
            }
          ],
          responses: {
            200: {
              description: 'User profile retrieved successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/User' }
                }
              }
            },
            404: { $ref: '#/components/responses/NotFound' },
            500: { $ref: '#/components/responses/InternalServerError' }
          }
        }
      },
      '/api/users/{address}/portfolio': {
        get: {
          summary: 'Get user portfolio',
          description: 'Retrieve user portfolio including owned properties and Aave position',
          tags: ['Users'],
          parameters: [
            {
              in: 'path',
              name: 'address',
              required: true,
              schema: { type: 'string', pattern: '^0x[a-fA-F0-9]{40}$' },
              description: 'Ethereum address of the user'
            }
          ],
          responses: {
            200: {
              description: 'User portfolio retrieved successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/UserPortfolio' }
                }
              }
            },
            404: { $ref: '#/components/responses/NotFound' },
            500: { $ref: '#/components/responses/InternalServerError' }
          }
        }
      },
      '/api/aave/position/{address}': {
        get: {
          summary: 'Get Aave position',
          description: 'Retrieve Aave lending/borrowing position for a user',
          tags: ['Aave'],
          parameters: [
            {
              in: 'path',
              name: 'address',
              required: true,
              schema: { type: 'string', pattern: '^0x[a-fA-F0-9]{40}$' },
              description: 'Ethereum address of the user'
            }
          ],
          responses: {
            200: {
              description: 'Aave position retrieved successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/AavePosition' }
                }
              }
            },
            404: { $ref: '#/components/responses/NotFound' },
            500: { $ref: '#/components/responses/InternalServerError' }
          }
        }
      },
      '/api/aave/supply': {
        post: {
          summary: 'Supply tokens as collateral',
          description: 'Supply property tokens as collateral to Aave',
          tags: ['Aave'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SupplyRequest' }
              }
            }
          },
          responses: {
            200: {
              description: 'Tokens supplied as collateral successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      transactionHash: { type: 'string' },
                      suppliedAmount: { type: 'number' },
                      newHealthFactor: { type: 'number' },
                      message: { type: 'string' }
                    }
                  }
                }
              }
            },
            500: { $ref: '#/components/responses/InternalServerError' }
          }
        }
      },
      '/api/aave/borrow': {
        post: {
          summary: 'Borrow assets from Aave',
          description: 'Borrow assets against supplied collateral',
          tags: ['Aave'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/BorrowRequest' }
              }
            }
          },
          responses: {
            200: {
              description: 'Assets borrowed successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      transactionHash: { type: 'string' },
                      borrowedAmount: { type: 'number' },
                      asset: { type: 'string' },
                      newHealthFactor: { type: 'number' },
                      message: { type: 'string' }
                    }
                  }
                }
              }
            },
            500: { $ref: '#/components/responses/InternalServerError' }
          }
        }
      },
      '/api/aave/repay': {
        post: {
          summary: 'Repay borrowed assets',
          description: 'Repay borrowed assets to Aave',
          tags: ['Aave'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RepayRequest' }
              }
            }
          },
          responses: {
            200: {
              description: 'Loan repaid successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      transactionHash: { type: 'string' },
                      repaidAmount: { type: 'number' },
                      asset: { type: 'string' },
                      newHealthFactor: { type: 'number' },
                      message: { type: 'string' }
                    }
                  }
                }
              }
            },
            500: { $ref: '#/components/responses/InternalServerError' }
          }
        }
      },
      '/api/yield/{propertyId}': {
        get: {
          summary: 'Get yield info for property',
          description: 'Retrieve yield pool and APY for a property',
          tags: ['Yield'],
          parameters: [
            {
              in: 'path',
              name: 'propertyId',
              required: true,
              schema: { type: 'string' },
              description: 'Property ID'
            }
          ],
          responses: {
            200: {
              description: 'Yield info retrieved successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/YieldInfo' }
                }
              }
            },
            404: { $ref: '#/components/responses/NotFound' },
            500: { $ref: '#/components/responses/InternalServerError' }
          }
        }
      },
      '/api/yield/{propertyId}/{address}': {
        get: {
          summary: 'Get user yield info for property',
          description: 'Retrieve yield info for a user and property',
          tags: ['Yield'],
          parameters: [
            {
              in: 'path',
              name: 'propertyId',
              required: true,
              schema: { type: 'string' },
              description: 'Property ID'
            },
            {
              in: 'path',
              name: 'address',
              required: true,
              schema: { type: 'string', pattern: '^0x[a-fA-F0-9]{40}$' },
              description: 'User address'
            }
          ],
          responses: {
            200: {
              description: 'User yield info retrieved successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/UserYieldInfo' }
                }
              }
            },
            404: { $ref: '#/components/responses/NotFound' },
            500: { $ref: '#/components/responses/InternalServerError' }
          }
        }
      },
      '/api/yield/claim': {
        post: {
          summary: 'Claim yield',
          description: 'Claim yield for a property',
          tags: ['Yield'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ClaimYieldRequest' }
              }
            }
          },
          responses: {
            200: {
              description: 'Yield claimed successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      transactionHash: { type: 'string' },
                      claimedAmount: { type: 'number' },
                      propertyId: { type: 'string' },
                      message: { type: 'string' }
                    }
                  }
                }
              }
            },
            500: { $ref: '#/components/responses/InternalServerError' }
          }
        }
      },
      '/api/marketplace': {
        get: {
          summary: 'Get marketplace listings',
          description: 'Retrieve active marketplace listings',
          tags: ['Marketplace'],
          parameters: [
            { in: 'query', name: 'propertyId', schema: { type: 'string' }, description: 'Property ID' },
            { in: 'query', name: 'minPrice', schema: { type: 'number' }, description: 'Minimum price' },
            { in: 'query', name: 'maxPrice', schema: { type: 'number' }, description: 'Maximum price' },
            { in: 'query', name: 'limit', schema: { type: 'integer', default: 20 }, description: 'Max listings' },
            { in: 'query', name: 'offset', schema: { type: 'integer', default: 0 }, description: 'Offset' }
          ],
          responses: {
            200: {
              description: 'Listings retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      listings: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/MarketplaceListing' }
                      },
                      total: { type: 'number' },
                      limit: { type: 'number' },
                      offset: { type: 'number' }
                    }
                  }
                }
              }
            },
            500: { $ref: '#/components/responses/InternalServerError' }
          }
        }
      },
      '/api/marketplace/list': {
        post: {
          summary: 'List token for sale',
          description: 'List a property token for sale on the marketplace',
          tags: ['Marketplace'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    tokenId: { type: 'number' },
                    price: { type: 'number' },
                    seller: { type: 'string' },
                    propertyId: { type: 'string' }
                  },
                  required: ['tokenId', 'price', 'seller', 'propertyId']
                }
              }
            }
          },
          responses: {
            200: {
              description: 'Token listed successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      listing: { $ref: '#/components/schemas/MarketplaceListing' },
                      message: { type: 'string' }
                    }
                  }
                }
              }
            },
            500: { $ref: '#/components/responses/InternalServerError' }
          }
        }
      },
      '/api/marketplace/buy': {
        post: {
          summary: 'Buy token from marketplace',
          description: 'Buy a listed property token from the marketplace',
          tags: ['Marketplace'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    listingId: { type: 'number' },
                    buyer: { type: 'string' }
                  },
                  required: ['listingId', 'buyer']
                }
              }
            }
          },
          responses: {
            200: {
              description: 'Token purchased successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      transactionHash: { type: 'string' },
                      tokenId: { type: 'number' },
                      price: { type: 'number' },
                      seller: { type: 'string' },
                      buyer: { type: 'string' },
                      message: { type: 'string' }
                    }
                  }
                }
              }
            },
            404: { $ref: '#/components/responses/NotFound' },
            500: { $ref: '#/components/responses/InternalServerError' }
          }
        }
      },
      '/api/prices/current': {
        get: {
          summary: 'Get current prices',
          description: 'Get the latest ETH and MATIC prices',
          tags: ['Prices'],
          responses: {
            200: {
              description: 'Current prices',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      timestamp: { type: 'string', format: 'date-time' },
                      ethPrice: { type: 'number' },
                      maticPrice: { type: 'number' },
                      source: { type: 'string' }
                    }
                  }
                }
              }
            },
            500: { $ref: '#/components/responses/InternalServerError' }
          }
        }
      },
      '/api/prices/history': {
        get: {
          summary: 'Get price history',
          description: 'Get historical price data for ETH and MATIC',
          tags: ['Prices'],
          parameters: [
            { in: 'query', name: 'days', schema: { type: 'integer', default: 7 }, description: 'Number of days of history' }
          ],
          responses: {
            200: {
              description: 'Price history',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      history: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            timestamp: { type: 'string' },
                            ethPrice: { type: 'number' },
                            maticPrice: { type: 'number' }
                          }
                        }
                      },
                      period: { type: 'string' }
                    }
                  }
                }
              }
            },
            500: { $ref: '#/components/responses/InternalServerError' }
          }
        }
      },
      '/api/crosschain/supported': {
        get: {
          summary: 'Get supported cross-chain networks',
          description: 'List supported cross-chain networks',
          tags: ['Cross-Chain'],
          responses: {
            200: {
              description: 'Supported chains',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      supportedChains: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            chainId: { type: 'number' },
                            name: { type: 'string' },
                            symbol: { type: 'string' },
                            active: { type: 'boolean' }
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            500: { $ref: '#/components/responses/InternalServerError' }
          }
        }
      },
      '/api/crosschain/transfer': {
        post: {
          summary: 'Initiate cross-chain transfer',
          description: 'Transfer a token across supported chains',
          tags: ['Cross-Chain'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    tokenId: { type: 'number' },
                    fromChain: { type: 'number' },
                    toChain: { type: 'number' },
                    recipient: { type: 'string' }
                  },
                  required: ['tokenId', 'fromChain', 'toChain', 'recipient']
                }
              }
            }
          },
          responses: {
            200: {
              description: 'Cross-chain transfer initiated',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      transferId: { type: 'string' },
                      tokenId: { type: 'number' },
                      fromChain: { type: 'number' },
                      toChain: { type: 'number' },
                      recipient: { type: 'string' },
                      estimatedTime: { type: 'string' },
                      message: { type: 'string' }
                    }
                  }
                }
              }
            },
            500: { $ref: '#/components/responses/InternalServerError' }
          }
        }
      },
      '/api/analytics/platform': {
        get: {
          summary: 'Get platform analytics',
          description: 'Retrieve platform-wide analytics and statistics',
          tags: ['Analytics'],
          responses: {
            200: {
              description: 'Platform analytics',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      totalProperties: { type: 'number' },
                      totalTokens: { type: 'number' },
                      totalValue: { type: 'number' },
                      totalSuppliedToAave: { type: 'number' },
                      totalBorrowedFromAave: { type: 'number' },
                      totalYieldDistributed: { type: 'number' },
                      averageAPY: { type: 'number' },
                      activeListings: { type: 'number' }
                    }
                  }
                }
              }
            },
            500: { $ref: '#/components/responses/InternalServerError' }
          }
        }
      },
      '/api/liquidation/risks': {
        get: {
          summary: 'Get liquidation risks',
          description: 'Retrieve positions at risk of liquidation',
          tags: ['Liquidation'],
          responses: {
            200: {
              description: 'Liquidation risk data',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      atRiskPositions: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            address: { type: 'string' },
                            healthFactor: { type: 'number' },
                            collateralValue: { type: 'number' },
                            borrowedAmount: { type: 'number' },
                            liquidationThreshold: { type: 'number' },
                            timeToLiquidation: { type: 'string' }
                          }
                        }
                      },
                      totalAtRisk: { type: 'number' },
                      averageHealthFactor: { type: 'number' }
                    }
                  }
                }
              }
            },
            500: { $ref: '#/components/responses/InternalServerError' }
          }
        }
      },
      '/api/auth/nonce': {
        post: {
          summary: 'Get authentication nonce',
          description: 'Request a nonce for wallet signature authentication',
          tags: ['Authentication'],
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['address'],
                  properties: {
                    address: {
                      type: 'string',
                      pattern: '^0x[a-fA-F0-9]{40}$',
                      description: 'Ethereum address of the user',
                      example: '0x1234567890abcdef1234567890abcdef12345678'
                    }
                  }
                }
              }
            }
          },
          responses: {
            200: {
              description: 'Nonce generated successfully',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/AuthNonceResponse'
                  }
                }
              }
            },
            400: {
              description: 'Invalid request',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      error: {
                        type: 'string',
                        example: 'Address is required'
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/auth/verify': {
        post: {
          summary: 'Verify wallet signature',
          description: 'Verify wallet signature and authenticate user',
          tags: ['Authentication'],
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/AuthVerifyRequest'
                }
              }
            }
          },
          responses: {
            200: {
              description: 'Authentication successful',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/AuthResponse'
                  }
                }
              }
            },
            400: {
              description: 'Invalid request',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      error: {
                        type: 'string',
                        example: 'Address and signature are required'
                      }
                    }
                  }
                }
              }
            },
            401: {
              description: 'Authentication failed',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      error: {
                        type: 'string',
                        example: 'Invalid signature'
                      }
                    }
                  }
                }
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
