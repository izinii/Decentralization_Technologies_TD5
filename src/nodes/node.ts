import bodyParser from "body-parser";
import express from "express";
import { BASE_NODE_PORT } from "../config";
import { Value } from "../types";

export async function node(
  nodeId: number, // ID of the node
  N: number, // Total number of nodes
  F: number, // Max number of faulty nodes
  initialValue: Value, // Initial value (0 or 1)
  isFaulty: boolean, // Whether the node is faulty
  nodesAreReady: () => boolean, // Check if all nodes are ready
  setNodeIsReady: (index: number) => void // Mark node as ready
) {
  const node = express();
  node.use(express.json());
  node.use(bodyParser.json());


  
  let killed = false;
  let x: 0 | 1 | "?" | null = isFaulty ? null : initialValue;
  let decided: boolean | null = isFaulty ? null : false;
  let k: number | null = isFaulty ? null : 0;


  // TODO implement this
  // this route allows retrieving the current status of the node
  // node.get("/status", (req, res) => {});
  node.get("/status", (req, res) => {
    if (isFaulty) {
      return res.status(500).json({ status: "faulty" });
    }
    return res.status(200).json({ status: "live" });
  });

  // TODO implement this
  // this route allows the node to receive messages from other nodes
  // node.post("/message", (req, res) => {});
  node.post("/message", (req, res) => {
    if (isFaulty || killed) {
      return res.status(400).json({ error: "Node is faulty or killed" });
    }

    const { sender, value, step } = req.body;

    if (step > (k ?? 0)) {
      k = step;
      x = value;
    }

    return res.status(200).json({ message: "Message received" });
  });

  // TODO implement this
  // this route is used to start the consensus algorithm
  // node.get("/start", async (req, res) => {});
  node.get("/start", async (req, res) => {
    if (isFaulty || killed) {
      return res.status(400).json({ error: "Node is faulty or killed" });
    }

    let round = 0;
    while (!decided) {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulating network delay

      if (nodesAreReady()) {
        round++;
        console.log(`Node ${nodeId} - Round ${round}, Value: ${x}`);

        if (x !== null && x !== "?") {
          decided = true;
          console.log(`Node ${nodeId} reached consensus on value: ${x}`);
        }
      }
    }

    return res.json({ message: "Consensus reached", value: x });
  });

  // TODO implement this
  // this route is used to stop the consensus algorithm
  // node.get("/stop", async (req, res) => {});
  node.get("/stop", async (req, res) => {
    killed = true;
    x = null;
    decided = null;
    k = null;
    return res.json({ message: "Node stopped" });
  });

  // TODO implement this
  // get the current state of a node
  // node.get("/getState", (req, res) => {});
  node.get("/getState", (req, res) => {
    return res.json({ killed, x, decided, k });
  });
  


  // start the server
  const server = node.listen(BASE_NODE_PORT + nodeId, async () => {
    console.log(
      `Node ${nodeId} is listening on port ${BASE_NODE_PORT + nodeId}`
    );

    // the node is ready
    setNodeIsReady(nodeId);
  });

  return server;
}