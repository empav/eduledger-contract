const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

async function deployEduLedgerFixture() {
  const [seller, buyer, other] = await ethers.getSigners();
  const EduLedger = await ethers.getContractFactory("EduLedger");
  const eduLedger = await EduLedger.deploy();

  return { eduLedger, seller, buyer, other };
}

describe("EduLedger", function () {
  it("mints files, stores price/seller, and tracks ownership", async function () {
    const { eduLedger, seller } = await loadFixture(deployEduLedgerFixture);
    const price = ethers.parseEther("1");

    await expect(eduLedger.mintFile("cid-1", price))
      .to.emit(eduLedger, "FileMinted")
      .withArgs(0, seller.address, "cid-1", price);

    expect(await eduLedger.ownerOf(0)).to.equal(seller.address);
    expect(await eduLedger.tokenPrice(0)).to.equal(price);
    expect(await eduLedger.tokenSeller(0)).to.equal(seller.address);
    expect(await eduLedger.totalMinted()).to.equal(1n);
    expect(await eduLedger.tokensOfOwner(seller.address)).to.deep.equal([0n]);
  });

  it("allows a different user to buy access and pays the seller", async function () {
    const { eduLedger, seller, buyer } = await loadFixture(deployEduLedgerFixture);
    const price = ethers.parseEther("0.5");

    await eduLedger.mintFile("cid-2", price);

    const tx = eduLedger.connect(buyer).buyAccess(0, { value: price });

    await expect(tx).to.changeEtherBalances([seller, buyer], [price, -price]);
    await expect(tx)
      .to.emit(eduLedger, "FilePurchased")
      .withArgs(0, seller.address, buyer.address, price);

    expect(await eduLedger.hasUserPurchased(0, buyer.address)).to.equal(true);
  });

  it("prevents a user from buying the same file twice", async function () {
    const { eduLedger, buyer } = await loadFixture(deployEduLedgerFixture);
    const price = ethers.parseEther("0.25");

    await eduLedger.mintFile("cid-duplicate", price);
    await eduLedger.connect(buyer).buyAccess(0, { value: price });

    await expect(
      eduLedger.connect(buyer).buyAccess(0, { value: price })
    ).to.be.revertedWith("Already purchased");
  });

  it("reverts when trying to buy without a seller (free file) or with wrong price", async function () {
    const { eduLedger, buyer } = await loadFixture(deployEduLedgerFixture);

    await eduLedger.mintFile("cid-free", 0);
    await expect(
      eduLedger.connect(buyer).buyAccess(0)
    ).to.be.revertedWith("Invalid seller");

    const price = ethers.parseEther("0.2");
    await eduLedger.mintFile("cid-paid", price);
    await expect(
      eduLedger.connect(buyer).buyAccess(1, { value: price - 1n })
    ).to.be.revertedWith("Incorrect price");
  });

  it("prevents a seller from buying their own file", async function () {
    const { eduLedger } = await loadFixture(deployEduLedgerFixture);
    const price = ethers.parseEther("0.1");

    await eduLedger.mintFile("cid-self", price);
    await expect(
      eduLedger.buyAccess(0, { value: price })
    ).to.be.revertedWith("Cannot buy your own file");
  });

  it("tracks user purchase status via hasUserPurchased", async function () {
    const { eduLedger, seller, buyer, other } = await loadFixture(deployEduLedgerFixture);
    const price = ethers.parseEther("0.05");

    await eduLedger.mintFile("cid-status", price);

    expect(await eduLedger.hasUserPurchased(0, buyer.address)).to.equal(false);
    expect(await eduLedger.hasUserPurchased(0, other.address)).to.equal(false);

    await eduLedger.connect(buyer).buyAccess(0, { value: price });

    expect(await eduLedger.hasUserPurchased(0, buyer.address)).to.equal(true);
    expect(await eduLedger.hasUserPurchased(0, other.address)).to.equal(false);
    expect(await eduLedger.hasUserPurchased(0, seller.address)).to.equal(false);
  });

  it("updates owned token lists on transfer", async function () {
    const { eduLedger, seller, other } = await loadFixture(deployEduLedgerFixture);

    await eduLedger.mintFile("cid-move", ethers.parseEther("0.3"));
    await eduLedger.transferFrom(seller.address, other.address, 0);

    expect(await eduLedger.tokensOfOwner(seller.address)).to.deep.equal([]);
    expect(await eduLedger.tokensOfOwner(other.address)).to.deep.equal([0n]);
  });
});
