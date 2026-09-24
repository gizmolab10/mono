{
  "version": "9",
  "scene": {
    "smart_objects": [
      {
        "id": "dicb460b903642b9",
        "name": "two drawer cabinet",
        "x": {
          "attributes": {
            "origin": 0,
            "extent": 609.5999999999999,
            "length": 609.5999999999999,
            "angle": 0
          },
          "invariant": 1
        },
        "y": {
          "attributes": {
            "origin": 0,
            "extent": 609.6,
            "length": 609.6,
            "angle": 0
          },
          "invariant": 1
        },
        "z": {
          "attributes": {
            "origin": 0,
            "extent": 762,
            "length": 762,
            "angle": 0
          },
          "invariant": 1
        },
        "visible": false,
        "hide_children": false
      },
      {
        "id": "di9d4d6d8626f83f",
        "name": "top drawer",
        "x": {
          "attributes": {
            "origin": {
              "formula": ".s"
            },
            "extent": 609.5999999999999,
            "length": {
              "formula": ".l"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "y": {
          "attributes": {
            "origin": {
              "formula": ".s"
            },
            "extent": 609.6,
            "length": {
              "formula": ".l"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "z": {
          "attributes": {
            "origin": {
              "formula": ".l * bottom fraction"
            },
            "extent": {
              "formula": ".e"
            },
            "length": 254,
            "angle": 0
          },
          "invariant": 2
        },
        "visible": false,
        "hide_children": false,
        "parent_id": "dicb460b903642b9"
      },
      {
        "id": "dic5474583fb2793",
        "name": "left",
        "x": {
          "attributes": {
            "origin": 12.7,
            "extent": 31.75,
            "length": 19.05,
            "angle": 0
          },
          "invariant": 1
        },
        "y": {
          "attributes": {
            "origin": 12.7,
            "extent": 596.9000000000001,
            "length": {
              "formula": ".l - 1\""
            },
            "angle": 0
          },
          "invariant": 1
        },
        "z": {
          "attributes": {
            "origin": 12.7,
            "extent": 241.30000000000007,
            "length": {
              "formula": ".l - 1\""
            },
            "angle": 0
          },
          "invariant": 1
        },
        "visible": true,
        "hide_children": false,
        "parent_id": "di9d4d6d8626f83f"
      },
      {
        "id": "di9e40228b997401",
        "name": "front",
        "x": {
          "attributes": {
            "origin": 0,
            "extent": 609.5999999999999,
            "length": {
              "formula": ".l"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "y": {
          "attributes": {
            "origin": 0,
            "extent": 19.049999999999955,
            "length": 19.049999999999955,
            "angle": 0
          },
          "invariant": 1
        },
        "z": {
          "attributes": {
            "origin": 0,
            "extent": 254,
            "length": {
              "formula": ".l"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "visible": true,
        "hide_children": false,
        "parent_id": "di9d4d6d8626f83f"
      },
      {
        "id": "di8d49508ae493aa",
        "name": "right",
        "x": {
          "attributes": {
            "origin": 565.15,
            "extent": {
              "formula": ".l - 1\""
            },
            "length": 19.049999999999955,
            "angle": 0
          },
          "invariant": 0
        },
        "y": {
          "attributes": {
            "origin": 12.7,
            "extent": 596.9000000000001,
            "length": {
              "formula": ".l - 1\""
            },
            "angle": 0
          },
          "invariant": 1
        },
        "z": {
          "attributes": {
            "origin": 12.7,
            "extent": 241.30000000000007,
            "length": {
              "formula": ".l - 1\""
            },
            "angle": 0
          },
          "invariant": 1
        },
        "visible": true,
        "hide_children": false,
        "parent_id": "di9d4d6d8626f83f"
      },
      {
        "id": "di6c45e1a8f0fd95",
        "name": "back",
        "x": {
          "attributes": {
            "origin": 19.049999999999997,
            "extent": 577.8499999999999,
            "length": {
              "formula": ".l - 2\""
            },
            "angle": 0
          },
          "invariant": 1
        },
        "y": {
          "attributes": {
            "origin": 577.8499999999998,
            "extent": {
              "formula": ".l - 1/2\""
            },
            "length": 19.050000000000182,
            "angle": 0
          },
          "invariant": 0
        },
        "z": {
          "attributes": {
            "origin": 12.7,
            "extent": 241.30000000000007,
            "length": {
              "formula": ".l - 1\""
            },
            "angle": 0
          },
          "invariant": 1
        },
        "visible": true,
        "hide_children": false,
        "parent_id": "di9d4d6d8626f83f"
      },
      {
        "id": "di8a4cdc867c767f",
        "name": "bottom",
        "x": {
          "attributes": {
            "origin": 25.4,
            "extent": 571.4999999999999,
            "length": {
              "formula": ".l - 2 1/2\""
            },
            "angle": 0
          },
          "invariant": 1
        },
        "y": {
          "attributes": {
            "origin": 6.35,
            "extent": 584.2,
            "length": {
              "formula": ".l - 1 1/4\""
            },
            "angle": 0
          },
          "invariant": 1
        },
        "z": {
          "attributes": {
            "origin": 25.4,
            "extent": 38.099999999999795,
            "length": 12.699999999999818,
            "angle": 0
          },
          "invariant": 1
        },
        "visible": true,
        "hide_children": false,
        "parent_id": "di9d4d6d8626f83f"
      },
      {
        "id": "dic045a2b5f5b992",
        "name": "bottom drawer",
        "x": {
          "attributes": {
            "origin": {
              "formula": ".s"
            },
            "extent": 609.5999999999999,
            "length": {
              "formula": ".l"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "y": {
          "attributes": {
            "origin": {
              "formula": ".s"
            },
            "extent": 609.6,
            "length": {
              "formula": ".l"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "z": {
          "attributes": {
            "origin": {
              "formula": ".s"
            },
            "extent": 508,
            "length": {
              "formula": ".l * bottom fraction"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "visible": false,
        "hide_children": false,
        "parent_id": "dicb460b903642b9"
      },
      {
        "id": "di544928aa293c56",
        "name": "left",
        "x": {
          "attributes": {
            "origin": 12.7,
            "extent": 31.75,
            "length": 19.05,
            "angle": 0
          },
          "invariant": 1
        },
        "y": {
          "attributes": {
            "origin": 12.7,
            "extent": 596.9000000000001,
            "length": {
              "formula": ".l - 1\""
            },
            "angle": 0
          },
          "invariant": 1
        },
        "z": {
          "attributes": {
            "origin": 12.7,
            "extent": 495.3,
            "length": {
              "formula": ".l - 1\""
            },
            "angle": 0
          },
          "invariant": 1
        },
        "visible": true,
        "hide_children": false,
        "parent_id": "dic045a2b5f5b992"
      },
      {
        "id": "di2d4bbf94a9307b",
        "name": "front",
        "x": {
          "attributes": {
            "origin": 0,
            "extent": 609.5999999999999,
            "length": {
              "formula": ".l"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "y": {
          "attributes": {
            "origin": 0,
            "extent": 19.049999999999955,
            "length": 19.049999999999955,
            "angle": 0
          },
          "invariant": 1
        },
        "z": {
          "attributes": {
            "origin": 0,
            "extent": 508,
            "length": {
              "formula": ".l"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "visible": true,
        "hide_children": false,
        "parent_id": "dic045a2b5f5b992"
      },
      {
        "id": "di7f422cb097ce34",
        "name": "right",
        "x": {
          "attributes": {
            "origin": 565.15,
            "extent": {
              "formula": ".l - 1\""
            },
            "length": 19.049999999999955,
            "angle": 0
          },
          "invariant": 0
        },
        "y": {
          "attributes": {
            "origin": 12.7,
            "extent": 596.9000000000001,
            "length": {
              "formula": ".l - 1\""
            },
            "angle": 0
          },
          "invariant": 1
        },
        "z": {
          "attributes": {
            "origin": 12.7,
            "extent": 495.3,
            "length": {
              "formula": ".l - 1\""
            },
            "angle": 0
          },
          "invariant": 1
        },
        "visible": true,
        "hide_children": false,
        "parent_id": "dic045a2b5f5b992"
      },
      {
        "id": "dicc4d74a0d06db9",
        "name": "back",
        "x": {
          "attributes": {
            "origin": 19.049999999999997,
            "extent": 577.8499999999999,
            "length": {
              "formula": ".l - 2\""
            },
            "angle": 0
          },
          "invariant": 1
        },
        "y": {
          "attributes": {
            "origin": 577.8499999999998,
            "extent": {
              "formula": ".l - 1/2\""
            },
            "length": 19.050000000000182,
            "angle": 0
          },
          "invariant": 0
        },
        "z": {
          "attributes": {
            "origin": 12.7,
            "extent": 495.3,
            "length": {
              "formula": ".l - 1\""
            },
            "angle": 0
          },
          "invariant": 1
        },
        "visible": true,
        "hide_children": false,
        "parent_id": "dic045a2b5f5b992"
      },
      {
        "id": "di4a4cea943ff957",
        "name": "bottom",
        "x": {
          "attributes": {
            "origin": 25.4,
            "extent": 571.4999999999999,
            "length": {
              "formula": ".l - 2 1/2\""
            },
            "angle": 0
          },
          "invariant": 1
        },
        "y": {
          "attributes": {
            "origin": 6.35,
            "extent": 584.2,
            "length": {
              "formula": ".l - 1 1/4\""
            },
            "angle": 0
          },
          "invariant": 1
        },
        "z": {
          "attributes": {
            "origin": 25.4,
            "extent": 38.10000000000002,
            "length": 12.700000000000024,
            "angle": 0
          },
          "invariant": 1
        },
        "visible": true,
        "hide_children": false,
        "parent_id": "dic045a2b5f5b992"
      }
    ],
    "givens": [
      {
        "name": "bottom fraction",
        "value_mm": 0.6666666666666666,
        "locked": true,
        "is_scalar": true
      }
    ],
    "camera": {
      "eye": [
        0,
        0,
        2750
      ],
      "center": [
        0,
        0,
        0
      ],
      "up": [
        0,
        1,
        0
      ]
    },
    "root_id": "dicb460b903642b9",
    "selected_id": "dicb460b903642b9",
    "selected_face": 3
  }
}