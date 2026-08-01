export interface Stage6AnalogTier {
  readonly includeAny: readonly string[];
  readonly preferAny?: readonly string[];
  readonly excludeAny?: readonly string[];
}

export interface Stage6AnalogRule {
  readonly tiers: readonly Stage6AnalogTier[];
  readonly note: string;
}

export const STAGE6_ANALOG_RULES: Readonly<Record<string, Stage6AnalogRule>> = {
  "IFKB-CANON-00219": {
    "tiers": [
      {
        "includeAny": [
          "sweet bread",
          "sweet roll",
          "brioche",
          "milk bread"
        ],
        "excludeAny": [
          "pudding",
          "baby food"
        ]
      },
      {
        "includeAny": [
          "bread"
        ],
        "preferAny": [
          "sweet",
          "roll",
          "enriched"
        ],
        "excludeAny": [
          "cornbread",
          "bread stuffing",
          "baby food"
        ]
      }
    ],
    "note": "enriched sweet bread"
  },
  "IFKB-CANON-00224": {
    "tiers": [
      {
        "includeAny": [
          "sweet bread",
          "sweet roll",
          "brioche",
          "milk bread"
        ],
        "excludeAny": [
          "pudding",
          "baby food"
        ]
      },
      {
        "includeAny": [
          "bread"
        ],
        "preferAny": [
          "sweet",
          "roll",
          "enriched"
        ],
        "excludeAny": [
          "cornbread",
          "bread stuffing",
          "baby food"
        ]
      }
    ],
    "note": "enriched sweet bread"
  },
  "IFKB-CANON-00225": {
    "tiers": [
      {
        "includeAny": [
          "sweet bread",
          "sweet roll",
          "brioche",
          "milk bread"
        ],
        "excludeAny": [
          "pudding",
          "baby food"
        ]
      },
      {
        "includeAny": [
          "bread"
        ],
        "preferAny": [
          "sweet",
          "roll",
          "enriched"
        ],
        "excludeAny": [
          "cornbread",
          "bread stuffing",
          "baby food"
        ]
      }
    ],
    "note": "enriched sweet bread"
  },
  "IFKB-CANON-00239": {
    "tiers": [
      {
        "includeAny": [
          "date bar",
          "date cookie",
          "date-filled",
          "date filled"
        ],
        "excludeAny": [
          "baby food"
        ]
      },
      {
        "includeAny": [
          "fruit bar",
          "cookie"
        ],
        "preferAny": [
          "date",
          "fruit"
        ],
        "excludeAny": [
          "baby food"
        ]
      }
    ],
    "note": "date/fruit pastry"
  },
  "IFKB-CANON-00250": {
    "tiers": [
      {
        "includeAny": [
          "date bar",
          "date cookie",
          "date-filled",
          "date filled"
        ],
        "excludeAny": [
          "baby food"
        ]
      },
      {
        "includeAny": [
          "fruit bar",
          "cookie"
        ],
        "preferAny": [
          "date",
          "fruit"
        ],
        "excludeAny": [
          "baby food"
        ]
      }
    ],
    "note": "date/fruit pastry"
  },
  "IFKB-CANON-00226": {
    "tiers": [
      {
        "includeAny": [
          "starch pudding",
          "gelatin dessert"
        ],
        "excludeAny": [
          "baby food"
        ]
      },
      {
        "includeAny": [
          "pudding"
        ],
        "excludeAny": [
          "rice pudding",
          "bread pudding",
          "chocolate pudding",
          "baby food"
        ]
      }
    ],
    "note": "starch-based pudding"
  },
  "IFKB-CANON-00245": {
    "tiers": [
      {
        "includeAny": [
          "rice pudding"
        ],
        "excludeAny": [
          "baby food"
        ]
      },
      {
        "includeAny": [
          "pudding"
        ],
        "preferAny": [
          "rice",
          "milk"
        ],
        "excludeAny": [
          "baby food"
        ]
      }
    ],
    "note": "rice pudding"
  },
  "IFKB-CANON-00227": {
    "tiers": [
      {
        "includeAny": [
          "toffee",
          "nut brittle",
          "peanut brittle"
        ],
        "excludeAny": [
          "syrup"
        ]
      }
    ],
    "note": "nut brittle/toffee"
  },
  "IFKB-CANON-00228": {
    "tiers": [
      {
        "includeAny": [
          "nougat"
        ],
        "excludeAny": [
          "ice cream"
        ]
      }
    ],
    "note": "nougat"
  },
  "IFKB-CANON-00229": {
    "tiers": [
      {
        "includeAny": [
          "hard candy",
          "sugar candy"
        ],
        "excludeAny": [
          "chocolate"
        ]
      }
    ],
    "note": "hard candy"
  },
  "IFKB-CANON-00232": {
    "tiers": [
      {
        "includeAny": [
          "cupcake"
        ],
        "excludeAny": [
          "frosting only"
        ]
      },
      {
        "includeAny": [
          "cake"
        ],
        "preferAny": [
          "cupcake",
          "plain"
        ],
        "excludeAny": [
          "cheesecake",
          "fruitcake"
        ]
      }
    ],
    "note": "cupcake"
  },
  "IFKB-CANON-00233": {
    "tiers": [
      {
        "includeAny": [
          "marzipan",
          "almond candy",
          "almond paste"
        ],
        "excludeAny": [
          "milk substitute"
        ]
      },
      {
        "includeAny": [
          "candy"
        ],
        "preferAny": [
          "almond",
          "nut"
        ],
        "excludeAny": [
          "chocolate"
        ]
      }
    ],
    "note": "almond confection"
  },
  "IFKB-CANON-00234": {
    "tiers": [
      {
        "includeAny": [
          "coconut candy",
          "coconut macaroon",
          "coconut cookie"
        ],
        "excludeAny": [
          "milk"
        ]
      },
      {
        "includeAny": [
          "cookie"
        ],
        "preferAny": [
          "coconut"
        ],
        "excludeAny": [
          "chocolate"
        ]
      }
    ],
    "note": "coconut confection"
  },
  "IFKB-CANON-00235": {
    "tiers": [
      {
        "includeAny": [
          "cookie"
        ],
        "excludeAny": [
          "baby food",
          "cookie dough"
        ]
      }
    ],
    "note": "filled cookie"
  },
  "IFKB-CANON-00236": {
    "tiers": [
      {
        "includeAny": [
          "fried pastry",
          "fried dough",
          "fritter"
        ],
        "excludeAny": [
          "savory"
        ]
      },
      {
        "includeAny": [
          "pastry"
        ],
        "preferAny": [
          "fried"
        ],
        "excludeAny": [
          "meat"
        ]
      }
    ],
    "note": "fried pastry"
  },
  "IFKB-CANON-00237": {
    "tiers": [
      {
        "includeAny": [
          "rice cookie",
          "rice flour cookie"
        ],
        "excludeAny": [
          "baby food"
        ]
      },
      {
        "includeAny": [
          "cookie"
        ],
        "preferAny": [
          "rice",
          "shortbread"
        ],
        "excludeAny": [
          "cookie dough"
        ]
      }
    ],
    "note": "rice cookie"
  },
  "IFKB-CANON-00238": {
    "tiers": [
      {
        "includeAny": [
          "wafer cookie",
          "wafer"
        ],
        "excludeAny": [
          "ice cream cone"
        ]
      },
      {
        "includeAny": [
          "cookie"
        ],
        "preferAny": [
          "wafer",
          "thin"
        ],
        "excludeAny": [
          "cookie dough"
        ]
      }
    ],
    "note": "thin wafer pastry"
  },
  "IFKB-CANON-00240": {
    "tiers": [
      {
        "includeAny": [
          "almond cookie",
          "shortbread cookie",
          "butter cookie"
        ],
        "excludeAny": [
          "cookie dough"
        ]
      },
      {
        "includeAny": [
          "cookie"
        ],
        "preferAny": [
          "almond",
          "shortbread"
        ],
        "excludeAny": [
          "cookie dough"
        ]
      }
    ],
    "note": "almond/shortbread cookie"
  },
  "IFKB-CANON-00241": {
    "tiers": [
      {
        "includeAny": [
          "nougat"
        ],
        "excludeAny": [
          "ice cream"
        ]
      }
    ],
    "note": "nougat"
  },
  "IFKB-CANON-00242": {
    "tiers": [
      {
        "includeAny": [
          "caramel candy",
          "caramels"
        ],
        "excludeAny": [
          "sauce",
          "topping"
        ]
      },
      {
        "includeAny": [
          "candy"
        ],
        "preferAny": [
          "caramel"
        ],
        "excludeAny": [
          "chocolate"
        ]
      }
    ],
    "note": "caramel confection"
  },
  "IFKB-CANON-00243": {
    "tiers": [
      {
        "includeAny": [
          "turkish delight",
          "gumdrop",
          "jelly candy"
        ],
        "excludeAny": [
          "sauce"
        ]
      },
      {
        "includeAny": [
          "candy"
        ],
        "preferAny": [
          "jelly",
          "gum"
        ],
        "excludeAny": [
          "chocolate"
        ]
      }
    ],
    "note": "starch jelly confection"
  },
  "IFKB-CANON-00248": {
    "tiers": [
      {
        "includeAny": [
          "wafer cookie",
          "wafer"
        ],
        "excludeAny": [
          "ice cream cone"
        ]
      },
      {
        "includeAny": [
          "cookie"
        ],
        "preferAny": [
          "wafer",
          "thin"
        ],
        "excludeAny": [
          "cookie dough"
        ]
      }
    ],
    "note": "thin wafer pastry"
  },
  "IFKB-CANON-00249": {
    "tiers": [
      {
        "includeAny": [
          "sweet bread",
          "spice cake",
          "coffee cake"
        ],
        "excludeAny": [
          "pudding"
        ]
      },
      {
        "includeAny": [
          "cake"
        ],
        "preferAny": [
          "spice",
          "plain"
        ],
        "excludeAny": [
          "cheesecake"
        ]
      }
    ],
    "note": "spiced sweet bread/cake"
  },
  "IFKB-CANON-00251": {
    "tiers": [
      {
        "includeAny": [
          "tea biscuit",
          "shortbread cookie",
          "butter cookie"
        ],
        "excludeAny": [
          "cookie dough"
        ]
      },
      {
        "includeAny": [
          "cookie"
        ],
        "preferAny": [
          "plain",
          "shortbread"
        ],
        "excludeAny": [
          "cookie dough"
        ]
      }
    ],
    "note": "tea biscuit"
  },
  "IFKB-CANON-00252": {
    "tiers": [
      {
        "includeAny": [
          "chickpea snack",
          "chickpea flour"
        ],
        "excludeAny": [
          "hummus"
        ]
      },
      {
        "includeAny": [
          "shortbread cookie",
          "butter cookie"
        ],
        "excludeAny": [
          "cookie dough"
        ]
      }
    ],
    "note": "chickpea shortbread"
  },
  "IFKB-CANON-00253": {
    "tiers": [
      {
        "includeAny": [
          "rosette cookie",
          "fried cookie",
          "fried dough"
        ],
        "excludeAny": [
          "savory"
        ]
      },
      {
        "includeAny": [
          "cookie"
        ],
        "preferAny": [
          "fried",
          "crisp"
        ],
        "excludeAny": [
          "cookie dough"
        ]
      }
    ],
    "note": "fried rosette cookie"
  },
  "IFKB-CANON-00155": {
    "tiers": [
      {
        "includeAny": [
          "grilled chicken",
          "chicken, grilled",
          "chicken kebab"
        ],
        "excludeAny": [
          "sandwich",
          "salad",
          "soup"
        ]
      },
      {
        "includeAny": [
          "chicken"
        ],
        "preferAny": [
          "grilled",
          "roasted"
        ],
        "excludeAny": [
          "sandwich",
          "salad",
          "soup",
          "fried"
        ]
      }
    ],
    "note": "grilled chicken"
  },
  "IFKB-CANON-00159": {
    "tiers": [
      {
        "includeAny": [
          "grilled chicken",
          "chicken, grilled",
          "chicken kebab"
        ],
        "excludeAny": [
          "sandwich",
          "salad",
          "soup"
        ]
      },
      {
        "includeAny": [
          "chicken"
        ],
        "preferAny": [
          "grilled",
          "roasted"
        ],
        "excludeAny": [
          "sandwich",
          "salad",
          "soup",
          "fried"
        ]
      }
    ],
    "note": "grilled chicken"
  },
  "IFKB-CANON-00156": {
    "tiers": [
      {
        "includeAny": [
          "grilled fish",
          "fish, grilled",
          "baked fish"
        ],
        "excludeAny": [
          "sandwich",
          "salad"
        ]
      },
      {
        "includeAny": [
          "fish"
        ],
        "preferAny": [
          "grilled",
          "baked"
        ],
        "excludeAny": [
          "fried",
          "sandwich",
          "salad"
        ]
      }
    ],
    "note": "grilled fish"
  },
  "IFKB-CANON-00142": {
    "tiers": [
      {
        "includeAny": [
          "chicken and rice",
          "rice casserole",
          "rice with chicken"
        ],
        "excludeAny": [
          "soup"
        ]
      },
      {
        "includeAny": [
          "rice"
        ],
        "preferAny": [
          "chicken",
          "casserole"
        ],
        "excludeAny": [
          "pudding",
          "breakfast cereal"
        ]
      }
    ],
    "note": "chicken rice casserole"
  },
  "IFKB-CANON-00104": {
    "tiers": [
      {
        "includeAny": [
          "beef stew",
          "lamb stew",
          "meat stew"
        ],
        "excludeAny": [
          "baby food",
          "dry mix"
        ]
      },
      {
        "includeAny": [
          "stew"
        ],
        "preferAny": [
          "beef",
          "lamb",
          "chickpea"
        ],
        "excludeAny": [
          "chicken",
          "fish",
          "baby food"
        ]
      }
    ],
    "note": "meat-legume stew/soup"
  },
  "IFKB-CANON-00105": {
    "tiers": [
      {
        "includeAny": [
          "beef stew",
          "lamb stew",
          "meat stew"
        ],
        "excludeAny": [
          "baby food",
          "dry mix"
        ]
      },
      {
        "includeAny": [
          "stew"
        ],
        "preferAny": [
          "beef",
          "lamb",
          "chickpea"
        ],
        "excludeAny": [
          "chicken",
          "fish",
          "baby food"
        ]
      }
    ],
    "note": "meat-legume stew/soup"
  },
  "IFKB-CANON-00106": {
    "tiers": [
      {
        "includeAny": [
          "beef stew",
          "lamb stew",
          "meat stew"
        ],
        "excludeAny": [
          "baby food",
          "dry mix"
        ]
      },
      {
        "includeAny": [
          "stew"
        ],
        "preferAny": [
          "beef",
          "lamb",
          "chickpea"
        ],
        "excludeAny": [
          "chicken",
          "fish",
          "baby food"
        ]
      }
    ],
    "note": "meat-legume stew/soup"
  },
  "IFKB-CANON-00107": {
    "tiers": [
      {
        "includeAny": [
          "beef stew",
          "lamb stew",
          "meat stew"
        ],
        "excludeAny": [
          "baby food",
          "dry mix"
        ]
      },
      {
        "includeAny": [
          "stew"
        ],
        "preferAny": [
          "beef",
          "lamb",
          "chickpea"
        ],
        "excludeAny": [
          "chicken",
          "fish",
          "baby food"
        ]
      }
    ],
    "note": "meat-legume stew/soup"
  },
  "IFKB-CANON-00108": {
    "tiers": [
      {
        "includeAny": [
          "beef stew",
          "lamb stew",
          "meat stew"
        ],
        "excludeAny": [
          "baby food",
          "dry mix"
        ]
      },
      {
        "includeAny": [
          "stew"
        ],
        "preferAny": [
          "beef",
          "lamb",
          "chickpea"
        ],
        "excludeAny": [
          "chicken",
          "fish",
          "baby food"
        ]
      }
    ],
    "note": "meat-legume stew/soup"
  },
  "IFKB-CANON-00166": {
    "tiers": [
      {
        "includeAny": [
          "yogurt soup",
          "cucumber yogurt",
          "yogurt with cucumber"
        ],
        "excludeAny": [
          "baby food"
        ]
      },
      {
        "includeAny": [
          "yogurt"
        ],
        "preferAny": [
          "cucumber",
          "soup",
          "drink"
        ],
        "excludeAny": [
          "frozen",
          "ice cream"
        ]
      }
    ],
    "note": "yogurt-based cold dish"
  },
  "IFKB-CANON-00177": {
    "tiers": [
      {
        "includeAny": [
          "yogurt soup",
          "cucumber yogurt",
          "yogurt with cucumber"
        ],
        "excludeAny": [
          "baby food"
        ]
      },
      {
        "includeAny": [
          "yogurt"
        ],
        "preferAny": [
          "cucumber",
          "soup",
          "drink"
        ],
        "excludeAny": [
          "frozen",
          "ice cream"
        ]
      }
    ],
    "note": "yogurt-based cold dish"
  },
  "IFKB-CANON-00162": {
    "tiers": [
      {
        "includeAny": [
          "wheat porridge",
          "meat porridge",
          "grain porridge",
          "hot cereal"
        ],
        "excludeAny": [
          "baby food",
          "dry"
        ]
      },
      {
        "includeAny": [
          "porridge"
        ],
        "excludeAny": [
          "baby food",
          "dry"
        ]
      }
    ],
    "note": "cooked grain porridge"
  },
  "IFKB-CANON-00175": {
    "tiers": [
      {
        "includeAny": [
          "wheat porridge",
          "meat porridge",
          "grain porridge",
          "hot cereal"
        ],
        "excludeAny": [
          "baby food",
          "dry"
        ]
      },
      {
        "includeAny": [
          "porridge"
        ],
        "excludeAny": [
          "baby food",
          "dry"
        ]
      }
    ],
    "note": "cooked grain porridge"
  },
  "IFKB-CANON-00182": {
    "tiers": [
      {
        "includeAny": [
          "wheat porridge",
          "meat porridge",
          "grain porridge",
          "hot cereal"
        ],
        "excludeAny": [
          "baby food",
          "dry"
        ]
      },
      {
        "includeAny": [
          "porridge"
        ],
        "excludeAny": [
          "baby food",
          "dry"
        ]
      }
    ],
    "note": "cooked grain porridge"
  },
  "IFKB-CANON-00218": {
    "tiers": [
      {
        "includeAny": [
          "wheat porridge",
          "meat porridge",
          "grain porridge",
          "hot cereal"
        ],
        "excludeAny": [
          "baby food",
          "dry"
        ]
      },
      {
        "includeAny": [
          "porridge"
        ],
        "excludeAny": [
          "baby food",
          "dry"
        ]
      }
    ],
    "note": "cooked grain porridge"
  },
  "IFKB-CANON-00089": {
    "tiers": [
      {
        "includeAny": [
          "chicken stew",
          "stewed chicken"
        ],
        "excludeAny": [
          "baby food",
          "soup"
        ]
      },
      {
        "includeAny": [
          "chicken"
        ],
        "preferAny": [
          "stewed",
          "sauce"
        ],
        "excludeAny": [
          "fried",
          "sandwich",
          "salad"
        ]
      }
    ],
    "note": "chicken stew"
  },
  "IFKB-CANON-00090": {
    "tiers": [
      {
        "includeAny": [
          "chicken stew",
          "stewed chicken"
        ],
        "excludeAny": [
          "baby food",
          "soup"
        ]
      },
      {
        "includeAny": [
          "chicken"
        ],
        "preferAny": [
          "stewed",
          "sauce"
        ],
        "excludeAny": [
          "fried",
          "sandwich",
          "salad"
        ]
      }
    ],
    "note": "chicken stew"
  },
  "IFKB-CANON-00093": {
    "tiers": [
      {
        "includeAny": [
          "chicken stew",
          "stewed chicken"
        ],
        "excludeAny": [
          "baby food",
          "soup"
        ]
      },
      {
        "includeAny": [
          "chicken"
        ],
        "preferAny": [
          "stewed",
          "sauce"
        ],
        "excludeAny": [
          "fried",
          "sandwich",
          "salad"
        ]
      }
    ],
    "note": "chicken stew"
  },
  "IFKB-CANON-00101": {
    "tiers": [
      {
        "includeAny": [
          "fish stew",
          "stewed fish"
        ],
        "excludeAny": [
          "baby food"
        ]
      },
      {
        "includeAny": [
          "fish"
        ],
        "preferAny": [
          "stew",
          "stewed",
          "sauce"
        ],
        "excludeAny": [
          "fried",
          "sandwich"
        ]
      }
    ],
    "note": "fish stew"
  },
  "IFKB-CANON-00102": {
    "tiers": [
      {
        "includeAny": [
          "shrimp stew",
          "stewed shrimp",
          "shrimp in sauce"
        ],
        "excludeAny": [
          "baby food"
        ]
      },
      {
        "includeAny": [
          "shrimp"
        ],
        "preferAny": [
          "stew",
          "sauce",
          "cooked"
        ],
        "excludeAny": [
          "fried",
          "sandwich"
        ]
      }
    ],
    "note": "shrimp stew"
  },
  "IFKB-CANON-00196": {
    "tiers": [
      {
        "includeAny": [
          "spinach dip",
          "spinach yogurt",
          "yogurt spinach"
        ],
        "excludeAny": [
          "chips"
        ]
      },
      {
        "includeAny": [
          "dip"
        ],
        "preferAny": [
          "spinach",
          "yogurt"
        ],
        "excludeAny": [
          "cheese dip"
        ]
      }
    ],
    "note": "spinach yogurt dip"
  },
  "IFKB-CANON-00197": {
    "tiers": [
      {
        "includeAny": [
          "eggplant dip",
          "eggplant yogurt",
          "baba ghanoush"
        ],
        "excludeAny": [
          "chips"
        ]
      },
      {
        "includeAny": [
          "dip"
        ],
        "preferAny": [
          "eggplant"
        ],
        "excludeAny": [
          "cheese dip"
        ]
      }
    ],
    "note": "eggplant dip"
  },
  "IFKB-CANON-00202": {
    "tiers": [
      {
        "includeAny": [
          "yogurt with cucumber",
          "cucumber yogurt",
          "tzatziki"
        ],
        "excludeAny": [
          "frozen"
        ]
      },
      {
        "includeAny": [
          "yogurt"
        ],
        "preferAny": [
          "cucumber"
        ],
        "excludeAny": [
          "frozen",
          "ice cream"
        ]
      }
    ],
    "note": "cucumber yogurt"
  },
  "IFKB-CANON-00203": {
    "tiers": [
      {
        "includeAny": [
          "yogurt dip",
          "flavored yogurt"
        ],
        "excludeAny": [
          "frozen",
          "fruit"
        ]
      },
      {
        "includeAny": [
          "yogurt"
        ],
        "preferAny": [
          "plain",
          "lowfat"
        ],
        "excludeAny": [
          "frozen",
          "ice cream",
          "fruit"
        ]
      }
    ],
    "note": "savory yogurt"
  },
  "IFKB-CANON-00201": {
    "tiers": [
      {
        "includeAny": [
          "cucumber tomato salad",
          "tomato cucumber salad",
          "garden salad"
        ],
        "excludeAny": [
          "dressing",
          "chicken",
          "cheese"
        ]
      },
      {
        "includeAny": [
          "salad"
        ],
        "preferAny": [
          "cucumber",
          "tomato"
        ],
        "excludeAny": [
          "dressing",
          "chicken",
          "tuna",
          "pasta"
        ]
      }
    ],
    "note": "fresh cucumber tomato salad"
  },
  "IFKB-CANON-00204": {
    "tiers": [
      {
        "includeAny": [
          "mixed pickles",
          "pickled vegetables",
          "vegetable pickle"
        ],
        "excludeAny": [
          "sweet relish"
        ]
      },
      {
        "includeAny": [
          "pickle"
        ],
        "preferAny": [
          "mixed",
          "vegetable"
        ],
        "excludeAny": [
          "sandwich"
        ]
      }
    ],
    "note": "mixed vegetable pickle"
  },
  "IFKB-CANON-00205": {
    "tiers": [
      {
        "includeAny": [
          "mixed pickles",
          "pickled vegetables",
          "vegetable pickle"
        ],
        "excludeAny": [
          "sweet relish"
        ]
      },
      {
        "includeAny": [
          "pickle"
        ],
        "preferAny": [
          "mixed",
          "vegetable"
        ],
        "excludeAny": [
          "sandwich"
        ]
      }
    ],
    "note": "mixed vegetable pickle"
  },
  "IFKB-CANON-00206": {
    "tiers": [
      {
        "includeAny": [
          "mixed pickles",
          "pickled vegetables",
          "vegetable pickle"
        ],
        "excludeAny": [
          "sweet relish"
        ]
      },
      {
        "includeAny": [
          "pickle"
        ],
        "preferAny": [
          "mixed",
          "vegetable"
        ],
        "excludeAny": [
          "sandwich"
        ]
      }
    ],
    "note": "mixed vegetable pickle"
  },
  "IFKB-CANON-00116": {
    "tiers": [
      {
        "includeAny": [
          "roast lamb",
          "lamb, roasted",
          "roasted lamb"
        ],
        "excludeAny": [
          "sandwich",
          "stew"
        ]
      },
      {
        "includeAny": [
          "lamb"
        ],
        "preferAny": [
          "roasted",
          "cooked"
        ],
        "excludeAny": [
          "stew",
          "raw"
        ]
      }
    ],
    "note": "roasted lamb"
  },
  "IFKB-CANON-00117": {
    "tiers": [
      {
        "includeAny": [
          "dried beef",
          "beef jerky",
          "dried meat"
        ],
        "excludeAny": [
          "baby food"
        ]
      },
      {
        "includeAny": [
          "beef"
        ],
        "preferAny": [
          "dried",
          "jerky"
        ],
        "excludeAny": [
          "stew",
          "raw"
        ]
      }
    ],
    "note": "dried meat"
  },
  "IFKB-CANON-00161": {
    "tiers": [
      {
        "includeAny": [
          "baked fish",
          "fish, baked",
          "roasted fish"
        ],
        "excludeAny": [
          "sandwich",
          "breaded"
        ]
      },
      {
        "includeAny": [
          "fish"
        ],
        "preferAny": [
          "baked",
          "roasted"
        ],
        "excludeAny": [
          "fried",
          "sandwich",
          "breaded"
        ]
      }
    ],
    "note": "baked fish"
  },
  "IFKB-CANON-00211": {
    "tiers": [
      {
        "includeAny": [
          "lamb patty",
          "ground lamb",
          "lamb cooked"
        ],
        "excludeAny": [
          "raw",
          "sandwich"
        ]
      },
      {
        "includeAny": [
          "lamb"
        ],
        "preferAny": [
          "ground",
          "cooked",
          "patty"
        ],
        "excludeAny": [
          "raw",
          "stew"
        ]
      }
    ],
    "note": "ground cooked lamb"
  },
  "IFKB-CANON-00214": {
    "tiers": [
      {
        "includeAny": [
          "liver cooked",
          "beef liver",
          "lamb liver",
          "chicken liver"
        ],
        "excludeAny": [
          "raw",
          "pate"
        ]
      },
      {
        "includeAny": [
          "liver"
        ],
        "preferAny": [
          "cooked",
          "fried",
          "sauteed"
        ],
        "excludeAny": [
          "raw"
        ]
      }
    ],
    "note": "cooked liver/offal"
  },
  "IFKB-CANON-00198": {
    "tiers": [
      {
        "includeAny": [
          "eggplant dip",
          "baba ghanoush"
        ],
        "excludeAny": [
          "chips"
        ]
      },
      {
        "includeAny": [
          "eggplant"
        ],
        "preferAny": [
          "dip",
          "spread"
        ],
        "excludeAny": [
          "fried"
        ]
      }
    ],
    "note": "eggplant condiment"
  },
  "IFKB-CANON-00207": {
    "tiers": [
      {
        "includeAny": [
          "fish sauce"
        ],
        "excludeAny": [
          "cream sauce"
        ]
      },
      {
        "includeAny": [
          "sauce"
        ],
        "preferAny": [
          "fish",
          "fermented"
        ],
        "excludeAny": [
          "cream",
          "cheese"
        ]
      }
    ],
    "note": "fermented fish sauce"
  },
  "IFKB-CANON-00208": {
    "tiers": [
      {
        "includeAny": [
          "fish sauce"
        ],
        "excludeAny": [
          "cream sauce"
        ]
      },
      {
        "includeAny": [
          "sauce"
        ],
        "preferAny": [
          "fish",
          "fermented"
        ],
        "excludeAny": [
          "cream",
          "cheese"
        ]
      }
    ],
    "note": "fermented fish sauce"
  },
  "IFKB-CANON-00113": {
    "tiers": [
      {
        "includeAny": [
          "stuffed chicken",
          "chicken with stuffing"
        ],
        "excludeAny": [
          "sandwich",
          "soup"
        ]
      },
      {
        "includeAny": [
          "chicken"
        ],
        "preferAny": [
          "stuffed",
          "with stuffing"
        ],
        "excludeAny": [
          "sandwich",
          "salad"
        ]
      }
    ],
    "note": "stuffed chicken"
  },
  "IFKB-CANON-00114": {
    "tiers": [
      {
        "includeAny": [
          "stuffed fish",
          "fish with stuffing"
        ],
        "excludeAny": [
          "sandwich"
        ]
      },
      {
        "includeAny": [
          "fish"
        ],
        "preferAny": [
          "stuffed",
          "with stuffing",
          "baked"
        ],
        "excludeAny": [
          "fried",
          "sandwich"
        ]
      }
    ],
    "note": "stuffed fish"
  },
  "IFKB-CANON-00115": {
    "tiers": [
      {
        "includeAny": [
          "stuffed fish",
          "fish with stuffing"
        ],
        "excludeAny": [
          "sandwich"
        ]
      },
      {
        "includeAny": [
          "fish"
        ],
        "preferAny": [
          "stuffed",
          "with stuffing",
          "baked"
        ],
        "excludeAny": [
          "fried",
          "sandwich"
        ]
      }
    ],
    "note": "stuffed fish"
  },
  "IFKB-CANON-00192": {
    "tiers": [
      {
        "includeAny": [
          "stuffed pepper",
          "stuffed bell pepper"
        ],
        "excludeAny": [
          "raw"
        ]
      }
    ],
    "note": "stuffed bell pepper"
  },
  "IFKB-CANON-00193": {
    "tiers": [
      {
        "includeAny": [
          "stuffed cabbage",
          "cabbage roll"
        ],
        "excludeAny": [
          "raw"
        ]
      }
    ],
    "note": "stuffed cabbage"
  },
  "IFKB-CANON-00194": {
    "tiers": [
      {
        "includeAny": [
          "stuffed eggplant"
        ],
        "excludeAny": [
          "raw"
        ]
      },
      {
        "includeAny": [
          "eggplant"
        ],
        "preferAny": [
          "stuffed"
        ],
        "excludeAny": [
          "raw",
          "dip"
        ]
      }
    ],
    "note": "stuffed eggplant"
  },
  "IFKB-CANON-00195": {
    "tiers": [
      {
        "includeAny": [
          "stuffed tomato"
        ],
        "excludeAny": [
          "raw"
        ]
      },
      {
        "includeAny": [
          "tomato"
        ],
        "preferAny": [
          "stuffed"
        ],
        "excludeAny": [
          "raw",
          "sauce"
        ]
      }
    ],
    "note": "stuffed tomato"
  }
} as const;

export const STAGE6_ANALOG_TARGET_COUNT = Object.keys(STAGE6_ANALOG_RULES).length;
