import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("EduLedgerModule", (m) => {
  const eduLedger = m.contract("EduLedger");
  return { eduLedger };
});
