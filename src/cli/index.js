#!/usr/bin/env node

async function main () {
  const cfg = {
    root: "./example",
  }

  console.log("Not implemented")
}

main().catch(function (err : Error) {
  /* eslint-disable no-process-exit */
  console.error("error", err)
  process.exit(1)
})
