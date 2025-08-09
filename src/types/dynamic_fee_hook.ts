/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/dynamic_fee_hook.json`.
 */
export type DynamicFeeHook = {
  "address": "69VddXVhzGRGh3oU6eKoWEoNMJC8RJX6by1SgcuQfPR9",
  "metadata": {
    "name": "dynamicFeeHook",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Dynamic Fee Transfer Hook for LokoSwap"
  },
  "instructions": [
    {
      "name": "initializeExtraAccountMetaList",
      "discriminator": [
        43,
        34,
        13,
        49,
        167,
        88,
        235,
        235
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "extraAccountMetaList",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  120,
                  116,
                  114,
                  97,
                  45,
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116,
                  45,
                  109,
                  101,
                  116,
                  97,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        },
        {
          "name": "mint"
        },
        {
          "name": "feeStats",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  102,
                  101,
                  101,
                  95,
                  115,
                  116,
                  97,
                  116,
                  115
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "transferHook",
      "discriminator": [
        105,
        37,
        101,
        197,
        75,
        251,
        102,
        26
      ],
      "accounts": [
        {
          "name": "sourceToken"
        },
        {
          "name": "mint"
        },
        {
          "name": "destinationToken"
        },
        {
          "name": "owner"
        },
        {
          "name": "extraAccountMetaList",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  120,
                  116,
                  114,
                  97,
                  45,
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116,
                  45,
                  109,
                  101,
                  116,
                  97,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        },
        {
          "name": "wsolMint"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "delegate",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  101,
                  108,
                  101,
                  103,
                  97,
                  116,
                  101
                ]
              }
            ]
          }
        },
        {
          "name": "delegateWsolTokenAccount",
          "writable": true
        },
        {
          "name": "senderWsolTokenAccount",
          "writable": true
        },
        {
          "name": "feeStats",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  102,
                  101,
                  101,
                  95,
                  115,
                  116,
                  97,
                  116,
                  115
                ]
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "dynamicFeeStats",
      "discriminator": [
        104,
        34,
        174,
        224,
        56,
        248,
        159,
        150
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "mathOverflow",
      "msg": "Math overflow in calculations"
    },
    {
      "code": 6001,
      "name": "invalidTransferState",
      "msg": "The token is not currently transferring"
    },
    {
      "code": 6002,
      "name": "feeCalculationFailed",
      "msg": "Fee calculation failed"
    },
    {
      "code": 6003,
      "name": "timeWindowUpdateFailed",
      "msg": "Time window update failed"
    }
  ],
  "types": [
    {
      "name": "dynamicFeeStats",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "totalFeesCollected",
            "type": "u64"
          },
          {
            "name": "totalTransfers",
            "type": "u64"
          },
          {
            "name": "totalVolume",
            "type": "u64"
          },
          {
            "name": "currentFeeBasisPoints",
            "type": "u16"
          },
          {
            "name": "baseFeeBasisPoints",
            "type": "u16"
          },
          {
            "name": "maxFeeBasisPoints",
            "type": "u16"
          },
          {
            "name": "recentTransfers",
            "type": {
              "array": [
                "u64",
                6
              ]
            }
          },
          {
            "name": "recentVolumes",
            "type": {
              "array": [
                "u64",
                6
              ]
            }
          },
          {
            "name": "currentMinuteSlot",
            "type": "u8"
          },
          {
            "name": "lastUpdateTimestamp",
            "type": "i64"
          },
          {
            "name": "peakTps",
            "type": "u16"
          },
          {
            "name": "avgTransferSize",
            "type": "u64"
          }
        ]
      }
    }
  ]
};
