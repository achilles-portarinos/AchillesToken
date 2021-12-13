const { accounts, contract } = require("@openzeppelin/test-environment");
const { expect } = require("chai");
const { BN, expectEvent, expectRevert } = require("@openzeppelin/test-helpers");

// Load compiled artifacts
const AchillesToken = contract.fromArtifact("AchillesToken");

// Start test block
describe("AchillesToken", function () {
  const [owner] = accounts;
  const spender = accounts[1];
  const initialBalance = 10 ** 6;

  beforeEach(async function () {
    // Deploy a new AchillesToken contract for each test
    this.contract = await AchillesToken.new(initialBalance, { from: owner });
  });

  it("check that balance of owner equals the initial total balance", async function () {
    let balance = (await this.contract.balanceOf(owner)).toString();
    expect(balance).to.equal(initialBalance.toString());
  });

  it("approve allowance for second account", async function () {
    // approve a potential transfer
    const receipt = await this.contract.approve(spender, 5000, { from: owner });

    // Test that a Approval event was emitted with the new value
    expectEvent(receipt, "Approval", {
      owner: owner,
      spender: spender,
      value: "5000",
    });

    // expect the corresponding amount has been allowed
    let allowance = await this.contract.allowance(owner, spender);
    expect(allowance).to.be.bignumber.equal(new BN("5000"));
  });

  it("transferFrom fails without proper allowance", async function () {
    await expectRevert(
      this.contract.transferFrom(owner, spender, 5000, { from: owner }),
      "ERC20: transfer amount exceeds allowance"
    );
  });

  it("transferFrom succeeds when properly allowed", async function () {
    const amount = 15000;
    // approve a potential transfer
    await this.contract.approve(spender, amount, { from: owner });

    await this.contract.transferFrom(owner, spender, amount, {
      from: spender,
    });
    let balance = (await this.contract.balanceOf(spender)).toString();
    expect(balance).to.equal(amount.toString());
  });

  it("transfer succeeds even without allowance, as long as the msg.sender has sufficient balance", async function () {
    const amount = 15000;
    // approve a potential transfer
    const receipt = await this.contract.transfer(spender, amount, {
      from: owner,
    });
    expectEvent(receipt, "Transfer", {
      from: owner,
      to: spender,
      value: amount.toString(),
    });

    let balance = (await this.contract.balanceOf(spender)).toString();
    expect(balance).to.equal(amount.toString());
  });

  it("transfer fails with insufficient balance", async function () {
    const amount = 15000;
    // approve a potential transfer
    await expectRevert(
      this.contract.transfer(owner, amount, {
        from: spender,
      }),
      "ERC20: transfer amount exceeds balance"
    );
  });
});
