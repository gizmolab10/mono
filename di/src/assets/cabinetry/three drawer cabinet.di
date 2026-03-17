{
  "version": "9",
  "scene": {
    "smart_objects": [
      {
        "id": "dicb460b903642b9",
        "name": "three drawer cabinet",
        "x": {
          "attributes": {
            "origin": 0,
            "extent": 623.6602178573609,
            "length": 623.6602178573609,
            "angle": 0
          },
          "invariant": 1
        },
        "y": {
          "attributes": {
            "origin": 0,
            "extent": 660.400000000001,
            "length": 660.400000000001,
            "angle": 0
          },
          "invariant": 1
        },
        "z": {
          "attributes": {
            "origin": 0,
            "extent": 990.5999999999999,
            "length": 990.5999999999999,
            "angle": 0
          },
          "invariant": 1
        },
        "visible": false,
        "hide_children": false
      },
      {
        "id": "dicc4c6ba79d7e9b",
        "name": "top drawer",
        "x": {
          "attributes": {
            "origin": {
              "formula": ".s"
            },
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
            "origin": {
              "formula": ".s"
            },
            "extent": 0,
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
              "formula": ".e - top h"
            },
            "extent": {
              "formula": ".e"
            },
            "length": 381,
            "angle": 0
          },
          "invariant": 2
        },
        "visible": false,
        "hide_children": false,
        "parent_id": "dicb460b903642b9"
      },
      {
        "id": "difa4deba6c4e2a7",
        "name": "left",
        "x": {
          "attributes": {
            "origin": {
              "formula": "side th"
            },
            "extent": -598.2602178573609,
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
            "extent": -6.349999999999909,
            "length": {
              "formula": ".l - inset * 2"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "visible": true,
        "hide_children": false,
        "parent_id": "dicc4c6ba79d7e9b"
      },
      {
        "id": "dib34634ad1cc72c",
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
            "extent": -641.3500000000007,
            "length": 19.050000000000296,
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
        "parent_id": "dicc4c6ba79d7e9b"
      },
      {
        "id": "di574c41b3fad180",
        "name": "right",
        "x": {
          "attributes": {
            "origin": 598.2602178573608,
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
            "extent": -6.349999999999909,
            "length": {
              "formula": ".l - inset * 2"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "visible": true,
        "hide_children": false,
        "parent_id": "dicc4c6ba79d7e9b"
      },
      {
        "id": "di8346c69358d88a",
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
            "origin": 647.700000000001,
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
            "extent": -6.349999999999909,
            "length": {
              "formula": ".l - inset * 2"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "visible": true,
        "hide_children": false,
        "parent_id": "dicc4c6ba79d7e9b"
      },
      {
        "id": "di1a4331bee9fa7a",
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
            "extent": -361.94999999999993,
            "length": {
              "formula": "bottom th"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "visible": true,
        "hide_children": false,
        "parent_id": "dicc4c6ba79d7e9b"
      },
      {
        "id": "di2b4406bdfb2163",
        "name": "middle drawer",
        "x": {
          "attributes": {
            "origin": {
              "formula": ".s"
            },
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
            "origin": {
              "formula": ".s"
            },
            "extent": 0,
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
              "formula": ".s + bottom h"
            },
            "extent": {
              "formula": ".l - top h"
            },
            "length": 292.0999999999999,
            "angle": 0
          },
          "invariant": 2
        },
        "visible": false,
        "hide_children": false,
        "parent_id": "dicb460b903642b9"
      },
      {
        "id": "di504c11978b02ef",
        "name": "left",
        "x": {
          "attributes": {
            "origin": {
              "formula": "side th"
            },
            "extent": -598.2602178573609,
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
            "extent": -6.349999999999909,
            "length": {
              "formula": ".l - inset * 2"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "visible": true,
        "hide_children": false,
        "parent_id": "di2b4406bdfb2163"
      },
      {
        "id": "diff40229cbae5e0",
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
            "extent": -641.350000000001,
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
        "parent_id": "di2b4406bdfb2163"
      },
      {
        "id": "dib44f449f7f4c34",
        "name": "right",
        "x": {
          "attributes": {
            "origin": 598.2602178573608,
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
            "extent": -6.349999999999909,
            "length": {
              "formula": ".l - inset * 2"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "visible": true,
        "hide_children": false,
        "parent_id": "di2b4406bdfb2163"
      },
      {
        "id": "di6c435f99079ce7",
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
            "origin": 647.700000000001,
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
            "extent": -6.349999999999909,
            "length": {
              "formula": ".l - inset * 2"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "visible": true,
        "hide_children": false,
        "parent_id": "di2b4406bdfb2163"
      },
      {
        "id": "di4048ce8f8a145a",
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
            "extent": -273.0499999999999,
            "length": {
              "formula": "bottom th"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "visible": true,
        "hide_children": false,
        "parent_id": "di2b4406bdfb2163"
      },
      {
        "id": "di8744bfa4bcc66b",
        "name": "bottom drawer",
        "x": {
          "attributes": {
            "origin": {
              "formula": ".s"
            },
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
            "origin": {
              "formula": ".s"
            },
            "extent": 0,
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
            "extent": -673.0999999999999,
            "length": {
              "formula": "bottom h"
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
        "id": "di0e4d0db4809d4e",
        "name": "left",
        "x": {
          "attributes": {
            "origin": {
              "formula": "side th"
            },
            "extent": -598.2602178573609,
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
            "extent": -6.349999999999966,
            "length": {
              "formula": ".l - inset * 2"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "visible": true,
        "hide_children": false,
        "parent_id": "di8744bfa4bcc66b"
      },
      {
        "id": "di3e460a8188fd73",
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
            "extent": -641.350000000001,
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
        "parent_id": "di8744bfa4bcc66b"
      },
      {
        "id": "di3249de9ce66d98",
        "name": "right",
        "x": {
          "attributes": {
            "origin": 598.2602178573608,
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
            "extent": -6.349999999999966,
            "length": {
              "formula": ".l - inset * 2"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "visible": true,
        "hide_children": false,
        "parent_id": "di8744bfa4bcc66b"
      },
      {
        "id": "di9543d190dbd868",
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
            "origin": 647.700000000001,
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
            "extent": -6.349999999999966,
            "length": {
              "formula": ".l - inset * 2"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "visible": true,
        "hide_children": false,
        "parent_id": "di8744bfa4bcc66b"
      },
      {
        "id": "di5545529413a2d9",
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
            "extent": -298.45,
            "length": {
              "formula": "bottom th"
            },
            "angle": 0
          },
          "invariant": 1
        },
        "visible": true,
        "hide_children": false,
        "parent_id": "di8744bfa4bcc66b"
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
        "value_mm": 381,
        "locked": false
      },
      {
        "name": "bottom h",
        "value_mm": 317.5,
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
    "selected_id": "di2b4406bdfb2163",
    "selected_face": 5
  }
}