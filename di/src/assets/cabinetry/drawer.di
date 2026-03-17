{
  "version": "9",
  "scene": {
    "smart_objects": [
      {
        "id": "dicb460b903642b9",
        "name": "drawer",
        "x": {
          "attributes": {
            "origin": 0,
            "extent": 609.6,
            "length": 609.6,
            "angle": 0
          },
          "invariant": 1
        },
        "y": {
          "attributes": {
            "origin": 0,
            "extent": 609.6000000000001,
            "length": 609.6000000000001,
            "angle": 0
          },
          "invariant": 1
        },
        "z": {
          "attributes": {
            "origin": 0,
            "extent": 152.39999999999998,
            "length": 152.39999999999998,
            "angle": 0
          },
          "invariant": 1
        },
        "visible": false,
        "hide_children": false
      },
      {
        "id": "di4b4804a2257d24",
        "name": "left",
        "x": {
          "attributes": {
            "origin": {
              "formula": "side th"
            },
            "extent": -584.2,
            "length": {
              "formula": "side th"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "y": {
          "attributes": {
            "origin": {
              "formula": "front th - dado"
            },
            "extent": 1.1368683772161603e-13,
            "length": {
              "formula": ".l - front th + dado"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "z": {
          "attributes": {
            "origin": {
              "formula": "inset"
            },
            "extent": -6.349999999999994,
            "length": {
              "formula": ".l - inset * 2"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "visible": true,
        "hide_children": false,
        "parent_id": "dicb460b903642b9"
      },
      {
        "id": "di13424da785088c",
        "name": "front",
        "x": {
          "attributes": {
            "origin": 0,
            "extent": 0,
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
            "extent": -590.5500000000002,
            "length": 19.049999999999955,
            "angle": 0
          },
          "invariant": 1
        },
        "z": {
          "attributes": {
            "origin": 0,
            "extent": 0,
            "length": {
              "formula": ".l"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "visible": true,
        "hide_children": false,
        "parent_id": "dicb460b903642b9"
      },
      {
        "id": "di7a4d149e03e80e",
        "name": "right",
        "x": {
          "attributes": {
            "origin": 584.1999999999999,
            "extent": {
              "formula": ".l - inset * 2"
            },
            "length": {
              "formula": "side th"
            },
            "angle": 0
          },
          "invariant": 0
        },
        "y": {
          "attributes": {
            "origin": {
              "formula": "front th - dado"
            },
            "extent": 1.1368683772161603e-13,
            "length": {
              "formula": ".l - front th + dado"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "z": {
          "attributes": {
            "origin": {
              "formula": "inset"
            },
            "extent": -6.349999999999994,
            "length": {
              "formula": ".l - inset * 2"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "visible": true,
        "hide_children": false,
        "parent_id": "dicb460b903642b9"
      },
      {
        "id": "di7649b89c909dd5",
        "name": "back",
        "x": {
          "attributes": {
            "origin": {
              "formula": "side th + inset"
            },
            "extent": -19.050000000000068,
            "length": {
              "formula": ".l - (side th + inset) * 2"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "y": {
          "attributes": {
            "origin": 596.9000000000001,
            "extent": {
              "formula": ".l"
            },
            "length": {
              "formula": "side th"
            },
            "angle": 0
          },
          "invariant": 0
        },
        "z": {
          "attributes": {
            "origin": {
              "formula": "inset"
            },
            "extent": -6.349999999999994,
            "length": {
              "formula": ".l - inset * 2"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "visible": true,
        "hide_children": false,
        "parent_id": "dicb460b903642b9"
      },
      {
        "id": "di2c4bcd860b5f48",
        "name": "bottom",
        "x": {
          "attributes": {
            "origin": {
              "formula": "side th + inset"
            },
            "extent": -19.050000000000068,
            "length": {
              "formula": ".l - (side th + inset) * 2"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "y": {
          "attributes": {
            "origin": {
              "formula": "front th - dado"
            },
            "extent": -6.349999999999909,
            "length": {
              "formula": ".l - inset * 3"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "z": {
          "attributes": {
            "origin": {
              "formula": "inset * 2"
            },
            "extent": -133.34999999999997,
            "length": {
              "formula": "bottom th"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "visible": true,
        "hide_children": false,
        "parent_id": "dicb460b903642b9"
      }
    ],
    "givens": [
      {
        "name": "inset",
        "value_mm": 6.35,
        "locked": true
      },
      {
        "name": "dado",
        "value_mm": 6.35,
        "locked": true
      },
      {
        "name": "top h",
        "value_mm": 101.6,
        "locked": false
      },
      {
        "name": "middle h",
        "value_mm": 152.39999999999998,
        "locked": false
      },
      {
        "name": "bottom h",
        "value_mm": 215.89999999999998,
        "locked": false
      },
      {
        "name": "bottom Inset",
        "value_mm": 19.049999999999997,
        "locked": true
      },
      {
        "name": "side th",
        "value_mm": 12.7,
        "locked": true
      },
      {
        "name": "front th",
        "value_mm": 19.049999999999997,
        "locked": true
      },
      {
        "name": "back th",
        "value_mm": 12.7,
        "locked": true
      },
      {
        "name": "bottom th",
        "value_mm": 6.35,
        "locked": true
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
    "selected_face": 1
  }
}