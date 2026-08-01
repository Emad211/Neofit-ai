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
        "includeAny": ["sweet bread", "sweet roll", "brioche", "milk bread"],
        "excludeAny": ["pudding", "baby food", "babyfood", "pickle", "pickles"]
      },
      {
        "includeAny": ["bread"],
        "preferAny": ["sweet", "roll", "enriched"],
        "excludeAny": ["cornbread", "bread stuffing", "baby food", "babyfood", "pickle", "pickles"]
      }
    ],
    "note": "enriched sweet bread"
  },
  "IFKB-CANON-00224": {
    "tiers": [
      {
        "includeAny": ["sweet bread", "sweet roll", "brioche", "milk bread"],
        "excludeAny": ["pudding", "baby food", "babyfood", "pickle", "pickles"]
      },
      {
        "includeAny": ["bread"],
        "preferAny": ["sweet", "roll", "enriched"],
        "excludeAny": ["cornbread", "bread stuffing", "baby food", "babyfood", "pickle", "pickles"]
      }
    ],
    "note": "enriched sweet bread"
  },
  "IFKB-CANON-00225": {
    "tiers": [
      {
        "includeAny": ["sweet bread", "sweet roll", "brioche", "milk bread"],
        "excludeAny": ["pudding", "baby food", "babyfood", "pickle", "pickles"]
      },
      {
        "includeAny": ["bread"],
        "preferAny": ["sweet", "roll", "enriched"],
        "excludeAny": ["cornbread", "bread stuffing", "baby food", "babyfood", "pickle", "pickles"]
      }
    ],
    "note": "enriched sweet bread"
  },
  "IFKB-CANON-00239": {
    "tiers": [
      {
        "includeAny": ["date bar", "date cookie", "date-filled", "date filled", "cookie fruit filled bar", "fruit filled bar"],
        "excludeAny": ["baby food", "babyfood"]
      },
      {
        "includeAny": ["fruit bar", "cookie"],
        "preferAny": ["date", "fruit"],
        "excludeAny": ["baby food", "babyfood"]
      }
    ],
    "note": "date/fruit pastry"
  },
  "IFKB-CANON-00250": {
    "tiers": [
      {
        "includeAny": ["date bar", "date cookie", "date-filled", "date filled", "cookie fruit filled bar", "fruit filled bar"],
        "excludeAny": ["baby food", "babyfood"]
      },
      {
        "includeAny": ["fruit bar", "cookie"],
        "preferAny": ["date", "fruit"],
        "excludeAny": ["baby food", "babyfood"]
      }
    ],
    "note": "date/fruit pastry"
  },
  "IFKB-CANON-00226": {
    "tiers": [
      {
        "includeAny": ["starch pudding", "gelatin dessert"],
        "excludeAny": ["baby food", "babyfood", "cottage cheese"]
      },
      {
        "includeAny": ["pudding"],
        "excludeAny": ["rice pudding", "bread pudding", "chocolate pudding", "baby food", "babyfood"]
      }
    ],
    "note": "starch-based pudding"
  },
  "IFKB-CANON-00245": {
    "tiers": [
      {
        "includeAny": ["rice pudding"],
        "excludeAny": ["baby food", "babyfood"]
      },
      {
        "includeAny": ["pudding"],
        "preferAny": ["rice", "milk"],
        "excludeAny": ["baby food", "babyfood"]
      }
    ],
    "note": "rice pudding"
  },
  "IFKB-CANON-00227": {"tiers":[{"includeAny":["toffee","nut brittle","peanut brittle"],"excludeAny":["syrup","babyfood"]}],"note":"nut brittle/toffee"},
  "IFKB-CANON-00228": {"tiers":[{"includeAny":["nougat"],"excludeAny":["ice cream","babyfood","chocolate"]}],"note":"nougat"},
  "IFKB-CANON-00229": {"tiers":[{"includeAny":["hard candy","sugar candy","candy hard"],"excludeAny":["chocolate","babyfood"]}],"note":"hard candy"},
  "IFKB-CANON-00232": {"tiers":[{"includeAny":["cupcake"],"excludeAny":["frosting only","babyfood"]},{"includeAny":["cake"],"preferAny":["cupcake","plain"],"excludeAny":["cheesecake","fruitcake","babyfood"]}],"note":"cupcake"},
  "IFKB-CANON-00233": {"tiers":[{"includeAny":["marzipan","almond candy","almond paste"],"excludeAny":["milk substitute","babyfood"]},{"includeAny":["candy"],"preferAny":["almond","nut"],"excludeAny":["chocolate","babyfood"]}],"note":"almond confection"},
  "IFKB-CANON-00234": {"tiers":[{"includeAny":["coconut candy","coconut macaroon","coconut cookie"],"excludeAny":["milk","babyfood"]},{"includeAny":["cookie"],"preferAny":["coconut"],"excludeAny":["chocolate","babyfood"]}],"note":"coconut confection"},
  "IFKB-CANON-00235": {"tiers":[{"includeAny":["cookie"],"excludeAny":["baby food","cookie dough","babyfood"]}],"note":"filled cookie"},
  "IFKB-CANON-00236": {"tiers":[{"includeAny":["fried pastry","fried dough","fritter"],"excludeAny":["savory","babyfood"]},{"includeAny":["pastry"],"preferAny":["fried"],"excludeAny":["meat","babyfood"]}],"note":"fried pastry"},
  "IFKB-CANON-00237": {"tiers":[{"includeAny":["rice cookie","rice flour cookie"],"excludeAny":["baby food","babyfood"]},{"includeAny":["cookie"],"preferAny":["rice","shortbread"],"excludeAny":["cookie dough","babyfood"]}],"note":"rice cookie"},
  "IFKB-CANON-00238": {"tiers":[{"includeAny":["wafer cookie","wafer"],"excludeAny":["ice cream cone","babyfood"]},{"includeAny":["cookie"],"preferAny":["wafer","thin"],"excludeAny":["cookie dough","babyfood"]}],"note":"thin wafer pastry"},
  "IFKB-CANON-00240": {"tiers":[{"includeAny":["almond cookie","shortbread cookie","butter cookie"],"excludeAny":["cookie dough","babyfood"]},{"includeAny":["cookie"],"preferAny":["almond","shortbread"],"excludeAny":["cookie dough","babyfood"]}],"note":"almond/shortbread cookie"},
  "IFKB-CANON-00241": {"tiers":[{"includeAny":["nougat"],"excludeAny":["ice cream","babyfood","chocolate"]}],"note":"nougat"},
  "IFKB-CANON-00242": {"tiers":[{"includeAny":["caramel candy","caramels"],"excludeAny":["sauce","topping","babyfood"]},{"includeAny":["candy"],"preferAny":["caramel"],"excludeAny":["chocolate","babyfood"]}],"note":"caramel confection"},
  "IFKB-CANON-00243": {"tiers":[{"includeAny":["turkish delight","gumdrop","jelly candy","candy fruit flavored pieces","candy taffy"],"excludeAny":["sauce","babyfood"]},{"includeAny":["candy"],"preferAny":["jelly","gum"],"excludeAny":["chocolate","babyfood"]}],"note":"starch jelly confection"},
  "IFKB-CANON-00248": {"tiers":[{"includeAny":["wafer cookie","wafer"],"excludeAny":["ice cream cone","babyfood"]},{"includeAny":["cookie"],"preferAny":["wafer","thin"],"excludeAny":["cookie dough","babyfood"]}],"note":"thin wafer pastry"},
  "IFKB-CANON-00249": {"tiers":[{"includeAny":["sweet bread","spice cake","coffee cake"],"excludeAny":["pudding","babyfood"]},{"includeAny":["cake"],"preferAny":["spice","plain"],"excludeAny":["cheesecake","babyfood"]}],"note":"spiced sweet bread/cake"},
  "IFKB-CANON-00251": {"tiers":[{"includeAny":["tea biscuit","shortbread cookie","butter cookie"],"excludeAny":["cookie dough","babyfood"]},{"includeAny":["cookie"],"preferAny":["plain","shortbread"],"excludeAny":["cookie dough","babyfood"]}],"note":"tea biscuit"},
  "IFKB-CANON-00252": {"tiers":[{"includeAny":["shortbread cookie","butter cookie"],"excludeAny":["cookie dough","babyfood"]},{"includeAny":["cookie"],"preferAny":["shortbread","plain"],"excludeAny":["cookie dough","babyfood","chocolate"]}],"note":"chickpea shortbread"},
  "IFKB-CANON-00253": {"tiers":[{"includeAny":["rosette cookie","fried cookie","fried dough"],"excludeAny":["savory","babyfood"]},{"includeAny":["cookie"],"preferAny":["fried","crisp"],"excludeAny":["cookie dough","babyfood"]}],"note":"fried rosette cookie"},

  "IFKB-CANON-00155": {"tiers":[{"includeAny":["grilled chicken","chicken, grilled","chicken kebab","chicken breast grilled","chicken grilled"],"excludeAny":["sandwich","salad","soup","babyfood"]},{"includeAny":["chicken"],"preferAny":["grilled","roasted"],"excludeAny":["sandwich","salad","soup","fried","babyfood"]}],"note":"grilled chicken"},
  "IFKB-CANON-00159": {"tiers":[{"includeAny":["grilled chicken","chicken, grilled","chicken kebab","chicken breast grilled","chicken grilled"],"excludeAny":["sandwich","salad","soup","babyfood"]},{"includeAny":["chicken"],"preferAny":["grilled","roasted"],"excludeAny":["sandwich","salad","soup","fried","babyfood"]}],"note":"grilled chicken"},
  "IFKB-CANON-00156": {"tiers":[{"includeAny":["grilled fish","fish, grilled","baked fish","catfish grilled","cod grilled","flounder grilled","salmon grilled"],"excludeAny":["sandwich","salad","babyfood"]},{"includeAny":["fish"],"preferAny":["grilled","baked"],"excludeAny":["fried","sandwich","salad","babyfood"]}],"note":"grilled fish"},
  "IFKB-CANON-00142": {"tiers":[{"includeAny":["chicken and rice","rice casserole","rice with chicken"],"excludeAny":["soup","babyfood","soupy"]},{"includeAny":["rice"],"preferAny":["chicken","casserole"],"excludeAny":["pudding","breakfast cereal","babyfood"]}],"note":"chicken rice casserole"},

  "IFKB-CANON-00104": {"tiers":[{"includeAny":["beef stew","lamb stew","meat stew"],"excludeAny":["baby food","dry mix","babyfood","potato from","stew meat"]},{"includeAny":["stew"],"preferAny":["beef","lamb","chickpea"],"excludeAny":["chicken","fish","baby food","babyfood"]}],"note":"meat-legume stew/soup"},
  "IFKB-CANON-00105": {"tiers":[{"includeAny":["beef stew","lamb stew","meat stew"],"excludeAny":["baby food","dry mix","babyfood","potato from","stew meat"]},{"includeAny":["stew"],"preferAny":["beef","lamb","chickpea"],"excludeAny":["chicken","fish","baby food","babyfood"]}],"note":"meat-legume stew/soup"},
  "IFKB-CANON-00106": {"tiers":[{"includeAny":["beef stew","lamb stew","meat stew"],"excludeAny":["baby food","dry mix","babyfood","potato from","stew meat"]},{"includeAny":["stew"],"preferAny":["beef","lamb","chickpea"],"excludeAny":["chicken","fish","baby food","babyfood"]}],"note":"meat-legume stew/soup"},
  "IFKB-CANON-00107": {"tiers":[{"includeAny":["beef stew","lamb stew","meat stew"],"excludeAny":["baby food","dry mix","babyfood","potato from","stew meat"]},{"includeAny":["stew"],"preferAny":["beef","lamb","chickpea"],"excludeAny":["chicken","fish","baby food","babyfood"]}],"note":"meat-legume stew/soup"},
  "IFKB-CANON-00108": {"tiers":[{"includeAny":["beef stew","lamb stew","meat stew"],"excludeAny":["baby food","dry mix","babyfood","potato from","stew meat"]},{"includeAny":["stew"],"preferAny":["beef","lamb","chickpea"],"excludeAny":["chicken","fish","baby food","babyfood"]}],"note":"meat-legume stew/soup"},

  "IFKB-CANON-00166": {"tiers":[{"includeAny":["yogurt soup","cucumber yogurt","yogurt with cucumber","tzatziki","yogurt dip"],"excludeAny":["baby food","babyfood","pretzel"]},{"includeAny":["yogurt"],"preferAny":["cucumber","soup","drink"],"excludeAny":["frozen","ice cream","babyfood","pretzel"]}],"note":"yogurt-based cold dish"},
  "IFKB-CANON-00177": {"tiers":[{"includeAny":["yogurt soup","cucumber yogurt","yogurt with cucumber","tzatziki","yogurt dip"],"excludeAny":["baby food","babyfood","pretzel"]},{"includeAny":["yogurt"],"preferAny":["cucumber","soup","drink"],"excludeAny":["frozen","ice cream","babyfood","pretzel"]}],"note":"yogurt-based cold dish"},

  "IFKB-CANON-00162": {"tiers":[{"includeAny":["wheat porridge","cream of wheat","hot wheat cereal","oatmeal cooked","oatmeal, cooked","cereal cooked"],"excludeAny":["baby food","babyfood","dry","instant dry"]},{"includeAny":["oatmeal","porridge","hot cereal"],"preferAny":["cooked","prepared"],"excludeAny":["baby food","babyfood","dry"]}],"note":"cooked grain porridge"},
  "IFKB-CANON-00175": {"tiers":[{"includeAny":["wheat porridge","cream of wheat","hot wheat cereal","oatmeal cooked","oatmeal, cooked","cereal cooked"],"excludeAny":["baby food","babyfood","dry","instant dry"]},{"includeAny":["oatmeal","porridge","hot cereal"],"preferAny":["cooked","prepared"],"excludeAny":["baby food","babyfood","dry"]}],"note":"cooked grain porridge"},
  "IFKB-CANON-00182": {"tiers":[{"includeAny":["wheat porridge","cream of wheat","hot wheat cereal","oatmeal cooked","oatmeal, cooked","cereal cooked"],"excludeAny":["baby food","babyfood","dry","instant dry"]},{"includeAny":["oatmeal","porridge","hot cereal"],"preferAny":["cooked","prepared"],"excludeAny":["baby food","babyfood","dry"]}],"note":"cooked grain porridge"},
  "IFKB-CANON-00218": {"tiers":[{"includeAny":["wheat porridge","cream of wheat","hot wheat cereal","oatmeal cooked","oatmeal, cooked","cereal cooked"],"excludeAny":["baby food","babyfood","dry","instant dry"]},{"includeAny":["oatmeal","porridge","hot cereal"],"preferAny":["cooked","prepared"],"excludeAny":["baby food","babyfood","dry"]}],"note":"cooked grain porridge"},

  "IFKB-CANON-00089": {"tiers":[{"includeAny":["chicken stew","stewed chicken","stew chicken"],"excludeAny":["baby food","soup","babyfood"]},{"includeAny":["chicken"],"preferAny":["stewed","sauce"],"excludeAny":["fried","sandwich","salad","babyfood"]}],"note":"chicken stew"},
  "IFKB-CANON-00090": {"tiers":[{"includeAny":["chicken stew","stewed chicken","stew chicken"],"excludeAny":["baby food","soup","babyfood"]},{"includeAny":["chicken"],"preferAny":["stewed","sauce"],"excludeAny":["fried","sandwich","salad","babyfood"]}],"note":"chicken stew"},
  "IFKB-CANON-00093": {"tiers":[{"includeAny":["chicken stew","stewed chicken","stew chicken"],"excludeAny":["baby food","soup","babyfood"]},{"includeAny":["chicken"],"preferAny":["stewed","sauce"],"excludeAny":["fried","sandwich","salad","babyfood"]}],"note":"chicken stew"},
  "IFKB-CANON-00101": {"tiers":[{"includeAny":["fish stew","stewed fish","stew fish"],"excludeAny":["baby food","babyfood"]},{"includeAny":["fish"],"preferAny":["stew","stewed","sauce"],"excludeAny":["fried","sandwich","babyfood"]}],"note":"fish stew"},
  "IFKB-CANON-00102": {"tiers":[{"includeAny":["shrimp stew","stewed shrimp","shrimp in sauce","stew shrimp"],"excludeAny":["baby food","babyfood"]},{"includeAny":["shrimp"],"preferAny":["stew","sauce","cooked"],"excludeAny":["fried","sandwich","babyfood"]}],"note":"shrimp stew"},

  "IFKB-CANON-00196": {"tiers":[{"includeAny":["spinach dip","spinach yogurt","yogurt spinach"],"excludeAny":["chips","babyfood"]},{"includeAny":["dip"],"preferAny":["spinach","yogurt"],"excludeAny":["cheese dip","babyfood"]}],"note":"spinach yogurt dip"},
  "IFKB-CANON-00197": {"tiers":[{"includeAny":["eggplant dip","eggplant yogurt","baba ghanoush"],"excludeAny":["chips","babyfood"]},{"includeAny":["dip"],"preferAny":["eggplant"],"excludeAny":["cheese dip","babyfood"]}],"note":"eggplant dip"},
  "IFKB-CANON-00202": {"tiers":[{"includeAny":["yogurt with cucumber","cucumber yogurt","tzatziki"],"excludeAny":["frozen","babyfood"]},{"includeAny":["yogurt"],"preferAny":["cucumber"],"excludeAny":["frozen","ice cream","babyfood","pretzel"]}],"note":"cucumber yogurt"},
  "IFKB-CANON-00203": {"tiers":[{"includeAny":["yogurt dip","flavored yogurt"],"excludeAny":["frozen","fruit","babyfood"]},{"includeAny":["yogurt"],"preferAny":["plain","lowfat"],"excludeAny":["frozen","ice cream","fruit","babyfood","pretzel"]}],"note":"savory yogurt"},
  "IFKB-CANON-00201": {"tiers":[{"includeAny":["cucumber tomato salad","tomato cucumber salad","garden salad"],"excludeAny":["dressing","chicken","cheese","babyfood"]},{"includeAny":["salad"],"preferAny":["cucumber","tomato"],"excludeAny":["dressing","chicken","tuna","pasta","egg salad","taco","babyfood"]}],"note":"fresh cucumber tomato salad"},
  "IFKB-CANON-00204": {"tiers":[{"includeAny":["pickled vegetables","vegetable pickle","pickles"],"excludeAny":["sweet relish","relish","loaf","sandwich","babyfood"]},{"includeAny":["pickle"],"preferAny":["mixed","vegetable","cucumber"],"excludeAny":["relish","loaf","sandwich","babyfood"]}],"note":"mixed vegetable pickle"},
  "IFKB-CANON-00205": {"tiers":[{"includeAny":["pickled vegetables","vegetable pickle","pickles"],"excludeAny":["sweet relish","relish","loaf","sandwich","babyfood"]},{"includeAny":["pickle"],"preferAny":["mixed","vegetable","cucumber"],"excludeAny":["relish","loaf","sandwich","babyfood"]}],"note":"mixed vegetable pickle"},
  "IFKB-CANON-00206": {"tiers":[{"includeAny":["pickled vegetables","vegetable pickle","pickles"],"excludeAny":["sweet relish","relish","loaf","sandwich","babyfood"]},{"includeAny":["pickle"],"preferAny":["mixed","vegetable","cucumber"],"excludeAny":["relish","loaf","sandwich","babyfood"]}],"note":"mixed vegetable pickle"},

  "IFKB-CANON-00116": {"tiers":[{"includeAny":["roast lamb","lamb, roasted","roasted lamb"],"excludeAny":["sandwich","stew","babyfood"]},{"includeAny":["lamb"],"preferAny":["roasted","cooked"],"excludeAny":["stew","raw","babyfood"]}],"note":"roasted lamb"},
  "IFKB-CANON-00117": {"tiers":[{"includeAny":["dried beef","beef jerky","dried meat"],"excludeAny":["baby food","babyfood"]},{"includeAny":["beef"],"preferAny":["dried","jerky"],"excludeAny":["stew","raw","babyfood"]}],"note":"dried meat"},
  "IFKB-CANON-00161": {"tiers":[{"includeAny":["baked fish","fish, baked","roasted fish"],"excludeAny":["sandwich","breaded","babyfood"]},{"includeAny":["fish"],"preferAny":["baked","roasted"],"excludeAny":["fried","sandwich","breaded","babyfood"]}],"note":"baked fish"},
  "IFKB-CANON-00211": {"tiers":[{"includeAny":["lamb patty","ground lamb","lamb cooked"],"excludeAny":["raw","sandwich","babyfood"]},{"includeAny":["lamb"],"preferAny":["ground","cooked","patty"],"excludeAny":["raw","stew","brain","heart","liver","babyfood"]}],"note":"ground cooked lamb"},
  "IFKB-CANON-00214": {"tiers":[{"includeAny":["liver cooked","beef liver","lamb liver","chicken liver"],"excludeAny":["raw","pate","babyfood"]},{"includeAny":["liver"],"preferAny":["cooked","fried","sauteed"],"excludeAny":["raw","babyfood"]}],"note":"cooked liver/offal"},
  "IFKB-CANON-00198": {"tiers":[{"includeAny":["eggplant dip","baba ghanoush"],"excludeAny":["chips","babyfood"]},{"includeAny":["eggplant"],"preferAny":["dip","spread"],"excludeAny":["fried","raw","babyfood"]}],"note":"eggplant condiment"},
  "IFKB-CANON-00207": {"tiers":[{"includeAny":["fish sauce"],"excludeAny":["cream sauce","babyfood"]},{"includeAny":["sauce"],"preferAny":["fish","fermented"],"excludeAny":["cream","cheese","rice","noodles","shells","babyfood"]}],"note":"fermented fish sauce"},
  "IFKB-CANON-00208": {"tiers":[{"includeAny":["fish sauce"],"excludeAny":["cream sauce","babyfood"]},{"includeAny":["sauce"],"preferAny":["fish","fermented"],"excludeAny":["cream","cheese","rice","noodles","shells","babyfood"]}],"note":"fermented fish sauce"},

  "IFKB-CANON-00113": {"tiers":[{"includeAny":["stuffed chicken","chicken with stuffing"],"excludeAny":["sandwich","soup","babyfood"]},{"includeAny":["chicken"],"preferAny":["stuffed","with stuffing"],"excludeAny":["sandwich","salad","shells","babyfood"]}],"note":"stuffed chicken"},
  "IFKB-CANON-00114": {"tiers":[{"includeAny":["stuffed fish","fish with stuffing"],"excludeAny":["sandwich","babyfood"]},{"includeAny":["fish"],"preferAny":["stuffed","with stuffing","baked"],"excludeAny":["fried","sandwich","babyfood"]}],"note":"stuffed fish"},
  "IFKB-CANON-00115": {"tiers":[{"includeAny":["stuffed fish","fish with stuffing"],"excludeAny":["sandwich","babyfood"]},{"includeAny":["fish"],"preferAny":["stuffed","with stuffing","baked"],"excludeAny":["fried","sandwich","babyfood"]}],"note":"stuffed fish"},
  "IFKB-CANON-00192": {"tiers":[{"includeAny":["stuffed pepper","stuffed bell pepper"],"excludeAny":["raw","babyfood"]}],"note":"stuffed bell pepper"},
  "IFKB-CANON-00193": {"tiers":[{"includeAny":["stuffed cabbage","cabbage roll"],"excludeAny":["raw","babyfood"]}],"note":"stuffed cabbage"},
  "IFKB-CANON-00194": {"tiers":[{"includeAny":["stuffed eggplant"],"excludeAny":["raw","babyfood"]},{"includeAny":["eggplant"],"preferAny":["stuffed"],"excludeAny":["raw","dip","pickled","babyfood"]}],"note":"stuffed eggplant"},
  "IFKB-CANON-00195": {"tiers":[{"includeAny":["stuffed tomato"],"excludeAny":["raw","babyfood"]},{"includeAny":["tomato"],"preferAny":["stuffed"],"excludeAny":["raw","sauce","babyfood"]}],"note":"stuffed tomato"}
} as const;

export const STAGE6_ANALOG_TARGET_COUNT = Object.keys(STAGE6_ANALOG_RULES).length;
