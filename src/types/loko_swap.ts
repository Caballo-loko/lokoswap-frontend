/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/loko_swap.json`.
 */
export type LokoSwap = {
  "address": "5zJ1miHbyLMqSEhZZxqQV3ECUzu6TPi1JhUSpwMFQVPh",
  "metadata": {
    "name": "lokoSwap",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "LokoSwap - A DEX for Token 2022 transfer hooks with an AMM"
  },
  "instructions": [
    {
      "name": "collectFees",
      "docs": [
        "Collect transfer fees from Token-2022 accounts",
        "Only callable by the pool authority",
        "",
        "# Arguments",
        "Additional accounts from which to collect fees should be passed via remaining_accounts.",
        "These accounts must contain withheld transfer fees for the specified mint."
      ],
      "discriminator": [
        164,
        152,
        207,
        99,
        30,
        186,
        19,
        182
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "config.seed",
                "account": "config"
              }
            ]
          }
        },
        {
          "name": "mint",
          "docs": [
            "The mint from which to collect transfer fees"
          ],
          "writable": true
        },
        {
          "name": "feeDestination",
          "docs": [
            "Destination account for collected fees"
          ],
          "writable": true
        },
        {
          "name": "tokenProgram"
        }
      ],
      "args": []
    },
    {
      "name": "deposit",
      "docs": [
        "Deposit tokens into the AMM pool to receive LP tokens",
        "Handles Token 2022 extensions including transfer fees and hooks",
        "",
        "# Arguments",
        "* `amount` - Amount of LP tokens to mint",
        "* `max_x` - Maximum amount of token X to deposit (including fees)",
        "* `max_y` - Maximum amount of token Y to deposit (including fees)",
        "",
        "# Transfer Hook Support",
        "Token-2022 handles all hook account resolution automatically.",
        "No additional accounts need to be provided via remaining_accounts."
      ],
      "discriminator": [
        242,
        35,
        198,
        137,
        82,
        225,
        242,
        182
      ],
      "accounts": [
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "mintX"
        },
        {
          "name": "mintY"
        },
        {
          "name": "userX",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "user"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "mintX"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "userY",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "user"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "mintY"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "vaultX",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "config"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "mintX"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "vaultY",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "config"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "mintY"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "config.seed",
                "account": "config"
              }
            ]
          }
        },
        {
          "name": "mintLp",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  112
                ]
              },
              {
                "kind": "account",
                "path": "config"
              }
            ]
          }
        },
        {
          "name": "userLp",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "user"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "mintLp"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "maxX",
          "type": "u64"
        },
        {
          "name": "maxY",
          "type": "u64"
        }
      ]
    },
    {
      "name": "initialize",
      "docs": [
        "Initialize a new AMM pool with support for Token 2022 extensions",
        "",
        "# Arguments",
        "* `seed` - Unique seed for this pool",
        "* `fee` - Trading fee in basis points (max 1000 = 10%)",
        "* `authority` - Optional authority for pool management",
        "* `transfer_fee_basis_points` - Default transfer fee for new tokens (basis points)",
        "* `max_transfer_fee` - Maximum transfer fee in base units",
        "* `hook_program_id` - Optional default hook program for transfers"
      ],
      "discriminator": [
        175,
        175,
        109,
        31,
        13,
        152,
        155,
        237
      ],
      "accounts": [
        {
          "name": "admin",
          "writable": true,
          "signer": true
        },
        {
          "name": "mintX",
          "docs": [
            "The first token mint - can be Token or Token 2022"
          ]
        },
        {
          "name": "mintY",
          "docs": [
            "The second token mint - can be Token or Token 2022"
          ]
        },
        {
          "name": "mintLp",
          "docs": [
            "LP token mint - created as Token 2022 to support future extensions"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  112
                ]
              },
              {
                "kind": "account",
                "path": "config"
              }
            ]
          }
        },
        {
          "name": "vaultX",
          "docs": [
            "Vault for token X - uses the same token program as mint_x"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "config"
              },
              {
                "kind": "account",
                "path": "tokenProgramX"
              },
              {
                "kind": "account",
                "path": "mintX"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "vaultY",
          "docs": [
            "Vault for token Y - uses the same token program as mint_y"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "config"
              },
              {
                "kind": "account",
                "path": "tokenProgramY"
              },
              {
                "kind": "account",
                "path": "mintY"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "config",
          "docs": [
            "AMM configuration account"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              },
              {
                "kind": "arg",
                "path": "seed"
              }
            ]
          }
        },
        {
          "name": "tokenProgram",
          "docs": [
            "Token program for LP tokens (Token 2022)"
          ]
        },
        {
          "name": "tokenProgramX",
          "docs": [
            "Token program for mint_x (could be Token or Token 2022)"
          ]
        },
        {
          "name": "tokenProgramY",
          "docs": [
            "Token program for mint_y (could be Token or Token 2022)"
          ]
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "seed",
          "type": "u64"
        },
        {
          "name": "fee",
          "type": "u16"
        },
        {
          "name": "authority",
          "type": {
            "option": "pubkey"
          }
        },
        {
          "name": "transferFeeBasisPoints",
          "type": "u16"
        },
        {
          "name": "maxTransferFee",
          "type": "u64"
        },
        {
          "name": "hookProgramId",
          "type": {
            "option": "pubkey"
          }
        }
      ]
    },
    {
      "name": "lock",
      "docs": [
        "Lock the pool to prevent deposits, withdrawals, and swaps",
        "Only callable by the pool authority"
      ],
      "discriminator": [
        21,
        19,
        208,
        43,
        237,
        62,
        255,
        87
      ],
      "accounts": [
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "config.seed",
                "account": "config"
              }
            ]
          }
        }
      ],
      "args": []
    },
    {
      "name": "swap",
      "docs": [
        "Swap tokens in the AMM pool",
        "Handles Token 2022 extensions including transfer fees and hooks",
        "",
        "# Arguments",
        "* `amount` - Amount of input tokens to swap",
        "* `is_x` - True if swapping X for Y, false if swapping Y for X",
        "* `min` - Minimum amount of output tokens to receive (after fees)",
        "",
        "# Transfer Fee Handling",
        "For input tokens with transfer fees: The specified amount includes fees",
        "For output tokens with transfer fees: The AMM pays the fees to ensure user receives `min` amount",
        "",
        "# Transfer Hook Support",
        "Token-2022 handles all hook account resolution automatically.",
        "No additional accounts need to be provided via remaining_accounts."
      ],
      "discriminator": [
        248,
        198,
        158,
        145,
        225,
        117,
        135,
        200
      ],
      "accounts": [
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "mintX"
        },
        {
          "name": "mintY"
        },
        {
          "name": "userX",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "user"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "mintX"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "userY",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "user"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "mintY"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "vaultX",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "config"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "mintX"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "vaultY",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "config"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "mintY"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "config.seed",
                "account": "config"
              }
            ]
          }
        },
        {
          "name": "mintLp",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  112
                ]
              },
              {
                "kind": "account",
                "path": "config"
              }
            ]
          }
        },
        {
          "name": "userLp",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "user"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "mintLp"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "isX",
          "type": "bool"
        },
        {
          "name": "min",
          "type": "u64"
        }
      ]
    },
    {
      "name": "unlock",
      "docs": [
        "Unlock the pool to allow deposits, withdrawals, and swaps",
        "Only callable by the pool authority"
      ],
      "discriminator": [
        101,
        155,
        40,
        21,
        158,
        189,
        56,
        203
      ],
      "accounts": [
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "config.seed",
                "account": "config"
              }
            ]
          }
        }
      ],
      "args": []
    },
    {
      "name": "updateFeeDestination",
      "docs": [
        "Update the fee destination account",
        "Only callable by the pool authority",
        "",
        "# Arguments",
        "* `new_destination` - New account to receive collected fees"
      ],
      "discriminator": [
        233,
        234,
        249,
        55,
        15,
        29,
        217,
        166
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "config.seed",
                "account": "config"
              }
            ]
          }
        },
        {
          "name": "mint",
          "docs": [
            "The mint from which to collect transfer fees"
          ],
          "writable": true
        },
        {
          "name": "feeDestination",
          "docs": [
            "Destination account for collected fees"
          ],
          "writable": true
        },
        {
          "name": "tokenProgram"
        }
      ],
      "args": [
        {
          "name": "newDestination",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "updateHookProgram",
      "docs": [
        "Update the default hook program",
        "Only callable by the pool authority",
        "",
        "# Arguments",
        "* `new_hook_program` - New default hook program (None to remove)"
      ],
      "discriminator": [
        64,
        112,
        147,
        1,
        226,
        195,
        230,
        39
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "config.seed",
                "account": "config"
              }
            ]
          }
        },
        {
          "name": "mint",
          "docs": [
            "The mint from which to collect transfer fees"
          ],
          "writable": true
        },
        {
          "name": "feeDestination",
          "docs": [
            "Destination account for collected fees"
          ],
          "writable": true
        },
        {
          "name": "tokenProgram"
        }
      ],
      "args": [
        {
          "name": "newHookProgram",
          "type": {
            "option": "pubkey"
          }
        }
      ]
    },
    {
      "name": "updateTransferFeeConfig",
      "docs": [
        "Update transfer fee configuration for the pool",
        "Only callable by the pool authority",
        "",
        "# Arguments",
        "* `new_fee_basis_points` - New default transfer fee (basis points, max 10000)",
        "* `new_max_fee` - New maximum transfer fee in base units"
      ],
      "discriminator": [
        167,
        83,
        107,
        237,
        1,
        210,
        249,
        1
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "config.seed",
                "account": "config"
              }
            ]
          }
        },
        {
          "name": "mint",
          "docs": [
            "The mint from which to collect transfer fees"
          ],
          "writable": true
        },
        {
          "name": "feeDestination",
          "docs": [
            "Destination account for collected fees"
          ],
          "writable": true
        },
        {
          "name": "tokenProgram"
        }
      ],
      "args": [
        {
          "name": "newFeeBasisPoints",
          "type": "u16"
        },
        {
          "name": "newMaxFee",
          "type": "u64"
        }
      ]
    },
    {
      "name": "withdraw",
      "docs": [
        "Withdraw tokens from the AMM pool by burning LP tokens",
        "Handles Token 2022 extensions including transfer fees and hooks",
        "",
        "# Arguments",
        "* `amount` - Amount of LP tokens to burn",
        "* `min_x` - Minimum amount of token X to receive (after fees)",
        "* `min_y` - Minimum amount of token Y to receive (after fees)",
        "",
        "# Transfer Hook Support",
        "Token-2022 handles all hook account resolution automatically.",
        "No additional accounts need to be provided via remaining_accounts."
      ],
      "discriminator": [
        183,
        18,
        70,
        156,
        148,
        109,
        161,
        34
      ],
      "accounts": [
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "mintX"
        },
        {
          "name": "mintY"
        },
        {
          "name": "userX",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "user"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "mintX"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "userY",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "user"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "mintY"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "vaultX",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "config"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "mintX"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "vaultY",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "config"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "mintY"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "config.seed",
                "account": "config"
              }
            ]
          }
        },
        {
          "name": "mintLp",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  112
                ]
              },
              {
                "kind": "account",
                "path": "config"
              }
            ]
          }
        },
        {
          "name": "userLp",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "user"
              },
              {
                "kind": "account",
                "path": "tokenProgram"
              },
              {
                "kind": "account",
                "path": "mintLp"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "minX",
          "type": "u64"
        },
        {
          "name": "minY",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "config",
      "discriminator": [
        155,
        12,
        170,
        224,
        30,
        250,
        204,
        130
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "defaultError",
      "msg": "defaultError"
    },
    {
      "code": 6001,
      "name": "offerExpired",
      "msg": "Offer expired."
    },
    {
      "code": 6002,
      "name": "poolLocked",
      "msg": "This pool is locked."
    },
    {
      "code": 6003,
      "name": "slippageExceeded",
      "msg": "Slippage exceeded."
    },
    {
      "code": 6004,
      "name": "overflow",
      "msg": "Overflow detected."
    },
    {
      "code": 6005,
      "name": "underflow",
      "msg": "Underflow detected."
    },
    {
      "code": 6006,
      "name": "invalidToken",
      "msg": "Invalid token."
    },
    {
      "code": 6007,
      "name": "liquidityLessThanMinimum",
      "msg": "Actual liquidity is less than minimum."
    },
    {
      "code": 6008,
      "name": "noLiquidityInPool",
      "msg": "No liquidity in pool."
    },
    {
      "code": 6009,
      "name": "bumpError",
      "msg": "Bump error."
    },
    {
      "code": 6010,
      "name": "curveError",
      "msg": "Curve error."
    },
    {
      "code": 6011,
      "name": "invalidFee",
      "msg": "Fee is greater than 100%. This is not a very good deal."
    },
    {
      "code": 6012,
      "name": "invalidAuthority",
      "msg": "Invalid update authority."
    },
    {
      "code": 6013,
      "name": "noAuthoritySet",
      "msg": "No update authority set."
    },
    {
      "code": 6014,
      "name": "invalidAmount",
      "msg": "Invalid amount."
    },
    {
      "code": 6015,
      "name": "transferHookNotFound",
      "msg": "Transfer hook extension not found."
    },
    {
      "code": 6016,
      "name": "transferFeeNotFound",
      "msg": "Transfer fee extension not found."
    },
    {
      "code": 6017,
      "name": "identicalMints",
      "msg": "Identical mints not allowed"
    },
    {
      "code": 6018,
      "name": "invalidTokenProgram",
      "msg": "Invalid token program"
    },
    {
      "code": 6019,
      "name": "unsupportedExtension",
      "msg": "Unsupported token extension"
    },
    {
      "code": 6020,
      "name": "mathOverflow",
      "msg": "Math Overflow"
    },
    {
      "code": 6021,
      "name": "insufficientFunds",
      "msg": "Insufficient funds"
    },
    {
      "code": 6022,
      "name": "unsupportedHookProgram",
      "msg": "Hook program not in approved list"
    }
  ],
  "types": [
    {
      "name": "config",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "seed",
            "type": "u64"
          },
          {
            "name": "authority",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "mintX",
            "type": "pubkey"
          },
          {
            "name": "mintY",
            "type": "pubkey"
          },
          {
            "name": "fee",
            "type": "u16"
          },
          {
            "name": "locked",
            "type": "bool"
          },
          {
            "name": "lpBump",
            "type": "u8"
          },
          {
            "name": "configBump",
            "type": "u8"
          },
          {
            "name": "feeDestination",
            "type": "pubkey"
          },
          {
            "name": "defaultTransferFeeBasisPoints",
            "type": "u16"
          },
          {
            "name": "defaultTransferFeeMax",
            "type": "u64"
          },
          {
            "name": "feeWithdrawAuthority",
            "type": "pubkey"
          },
          {
            "name": "defaultHookProgram",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "supportsTransferFees",
            "type": "bool"
          },
          {
            "name": "supportsTransferHooks",
            "type": "bool"
          },
          {
            "name": "supportsMetadata",
            "type": "bool"
          },
          {
            "name": "supportsInterestBearing",
            "type": "bool"
          },
          {
            "name": "approvedHookPrograms",
            "type": {
              "vec": "pubkey"
            }
          }
        ]
      }
    }
  ],
  "constants": [
    {
      "name": "seed",
      "type": "string",
      "value": "\"anchor\""
    }
  ]
};
