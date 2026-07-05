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
            "extent": 717.55,
            "length": 717.55,
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
            "extent": 736.5999999999999,
            "length": 736.5999999999999,
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
            "extent": 717.55,
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
            "extent": 660.400000000001,
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
              "formula": ".e - (.l * top fraction)"
            },
            "extent": {
              "formula": ".e"
            },
            "length": 147.31999999999994,
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
            "extent": 25.4,
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
            "extent": 660.4000000000011,
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
              "formula": ".s + inset"
            },
            "extent": 140.97000000000003,
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
            "extent": 717.55,
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
            "extent": 19.050000000000296,
            "length": 19.050000000000296,
            "angle": 0
          },
          "invariant": 1
        },
        "z": {
          "attributes": {
            "origin": 0,
            "extent": 147.31999999999994,
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
            "origin": 692.1499999999999,
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
            "extent": 660.4000000000011,
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
              "formula": ".s + inset"
            },
            "extent": 140.97000000000003,
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
            "extent": 698.4999999999999,
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
              "formula": ".s + inset"
            },
            "extent": 140.97000000000003,
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
            "extent": 698.4999999999999,
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
            "extent": 654.0500000000011,
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
              "formula": ".s + inset * 2"
            },
            "extent": 19.050000000000068,
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
            "extent": 717.55,
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
            "extent": 660.400000000001,
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
              "formula": ".s + bottom fraction"
            },
            "extent": {
              "formula": ".l - top fraction"
            },
            "length": 735.8999999999999,
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
            "extent": 25.4,
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
            "extent": 660.4000000000011,
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
              "formula": ".s + inset"
            },
            "extent": 729.5499999999998,
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
            "extent": 717.55,
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
            "extent": 735.8999999999999,
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
            "origin": 692.1499999999999,
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
            "extent": 660.4000000000011,
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
              "formula": ".s + inset"
            },
            "extent": 729.5499999999998,
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
            "extent": 698.4999999999999,
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
              "formula": ".s + inset"
            },
            "extent": 729.5499999999998,
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
            "extent": 698.4999999999999,
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
            "extent": 654.0500000000011,
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
              "formula": ".s + inset * 2"
            },
            "extent": 19.049999999999997,
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
            "extent": 717.55,
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
            "extent": 660.400000000001,
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
            "extent": 368.29999999999995,
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
        "id": "di0e4d0db4809d4e",
        "name": "left",
        "x": {
          "attributes": {
            "origin": {
              "formula": "side th"
            },
            "extent": 25.4,
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
            "extent": 660.4000000000011,
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
            "extent": 361.95,
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
            "extent": 717.55,
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
            "extent": 368.29999999999995,
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
            "origin": 692.1499999999999,
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
            "extent": 660.4000000000011,
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
            "extent": 361.95,
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
            "extent": 698.4999999999999,
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
            "extent": 361.95,
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
            "extent": 698.4999999999999,
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
            "extent": 654.0500000000011,
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
            "extent": 19.049999999999997,
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
        "locked": true,
        "is_scalar": false
      },
      {
        "name": "dado",
        "value_mm": 6.35,
        "locked": true,
        "is_scalar": false
      },
      {
        "name": "bottom Inset",
        "value_mm": 19.049999999999997,
        "locked": true,
        "is_scalar": false
      },
      {
        "name": "side th",
        "value_mm": 12.7,
        "locked": true,
        "is_scalar": false
      },
      {
        "name": "front th",
        "value_mm": 19.049999999999997,
        "locked": true,
        "is_scalar": false
      },
      {
        "name": "back th",
        "value_mm": 12.7,
        "locked": true,
        "is_scalar": false
      },
      {
        "name": "bottom th",
        "value_mm": 6.35,
        "locked": true,
        "is_scalar": false
      },
      {
        "name": "top fraction",
        "value_mm": 0.2,
        "locked": true,
        "is_scalar": true
      },
      {
        "name": "bottom fraction",
        "value_mm": 0.5,
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
    "selected_face": 5
  }
}