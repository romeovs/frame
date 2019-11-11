import path from "path"

import * as React from "react"
import { glob, asset } from "frame/util"

const bars =
  glob(__dirname__, "bar/*.yml")
    .map(function (pth) {
      const content = util.asset(path)
      const url = `/${path.basename(pth).replace(".yml", "")}`
      return {
        [url]: () => <Bar content={content} />
      }
    })

export default {
  ...bars,
  "/foo": () => <Foo />,
}
