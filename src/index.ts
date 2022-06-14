import express from "express";
import markoMiddleware from "@marko/express";

const port = parseInt(process.env.PORT || "15015", 10);
import view from "~/pages/home/index.marko";

express()
  .use("/static", express.static("dist/static", { maxAge: "28d" }))
  .use(markoMiddleware())
  .get("/", (req, res) => { res.marko(view as any); })
  .listen(port, () => {
    if (port) {
      console.log(`Listening on port ${port}`);
    }
  });
