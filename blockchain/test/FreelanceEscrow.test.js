const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("FreelanceEscrow", function () {
  let escrow;
  let owner, platformWallet, client, freelancer, voter1, voter2, voter3;
  let jobId;

  const JOB_AMOUNT = ethers.parseEther("1.0"); // 1 MATIC
  const PLATFORM_FEE_PERCENTAGE = 2n;

  beforeEach(async function () {
    // Get signers
    [owner, platformWallet, client, freelancer, voter1, voter2, voter3] = await ethers.getSigners();

    // Deploy contract
    const FreelanceEscrow = await ethers.getContractFactory("FreelanceEscrow");
    escrow = await FreelanceEscrow.deploy(platformWallet.address);
    await escrow.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await escrow.owner()).to.equal(owner.address);
    });

    it("Should set the platform wallet", async function () {
      expect(await escrow.platformWallet()).to.equal(platformWallet.address);
    });

    it("Should set the platform fee to 2%", async function () {
      expect(await escrow.platformFeePercentage()).to.equal(PLATFORM_FEE_PERCENTAGE);
    });
  });

  describe("Job Creation", function () {
    it("Should create a job with escrowed payment", async function () {
      const deadline = (await time.latest()) + 86400; // 1 day from now

      await expect(
        escrow.connect(client).createJob("Test Job", "QmTestIPFSHash", deadline, {
          value: JOB_AMOUNT,
        })
      )
        .to.emit(escrow, "JobCreated")
        .withArgs(1, client.address, JOB_AMOUNT, deadline);

      const job = await escrow.getJob(1);
      expect(job.client).to.equal(client.address);
      expect(job.amount).to.equal(JOB_AMOUNT);
      expect(job.status).to.equal(0); // Open
    });

    it("Should fail if no payment is sent", async function () {
      const deadline = (await time.latest()) + 86400;

      await expect(
        escrow.connect(client).createJob("Test Job", "QmTestIPFSHash", deadline, {
          value: 0,
        })
      ).to.be.revertedWith("Payment required");
    });

    it("Should fail if deadline is in the past", async function () {
      const pastDeadline = (await time.latest()) - 86400;

      await expect(
        escrow.connect(client).createJob("Test Job", "QmTestIPFSHash", pastDeadline, {
          value: JOB_AMOUNT,
        })
      ).to.be.revertedWith("Invalid deadline");
    });
  });

  describe("Job Acceptance", function () {
    beforeEach(async function () {
      const deadline = (await time.latest()) + 86400;
      await escrow.connect(client).createJob("Test Job", "QmTestIPFSHash", deadline, {
        value: JOB_AMOUNT,
      });
      jobId = 1;
    });

    it("Should allow freelancer to accept job", async function () {
      await expect(escrow.connect(freelancer).acceptJob(jobId))
        .to.emit(escrow, "JobAccepted")
        .withArgs(jobId, freelancer.address);

      const job = await escrow.getJob(jobId);
      expect(job.freelancer).to.equal(freelancer.address);
      expect(job.status).to.equal(1); // InProgress
    });

    it("Should not allow client to accept own job", async function () {
      await expect(escrow.connect(client).acceptJob(jobId)).to.be.revertedWith(
        "Client cannot accept own job"
      );
    });
  });

  describe("Work Submission and Approval", function () {
    beforeEach(async function () {
      const deadline = (await time.latest()) + 86400;
      await escrow.connect(client).createJob("Test Job", "QmTestIPFSHash", deadline, {
        value: JOB_AMOUNT,
      });
      jobId = 1;
      await escrow.connect(freelancer).acceptJob(jobId);
    });

    it("Should allow freelancer to submit work", async function () {
      await expect(escrow.connect(freelancer).submitWork(jobId, "QmDeliverableHash"))
        .to.emit(escrow, "WorkSubmitted")
        .withArgs(jobId, "QmDeliverableHash");

      const job = await escrow.getJob(jobId);
      expect(job.status).to.equal(2); // Submitted
    });

    it("Should allow client to approve and release payment", async function () {
      await escrow.connect(freelancer).submitWork(jobId, "QmDeliverableHash");

      const freelancerBalanceBefore = await ethers.provider.getBalance(freelancer.address);
      const platformBalanceBefore = await ethers.provider.getBalance(platformWallet.address);

      await escrow.connect(client).approveWork(jobId);

      const freelancerBalanceAfter = await ethers.provider.getBalance(freelancer.address);
      const platformBalanceAfter = await ethers.provider.getBalance(platformWallet.address);

      const expectedPlatformFee = (JOB_AMOUNT * PLATFORM_FEE_PERCENTAGE) / 100n;
      const expectedFreelancerPayment = JOB_AMOUNT - expectedPlatformFee;

      expect(freelancerBalanceAfter - freelancerBalanceBefore).to.equal(expectedFreelancerPayment);
      expect(platformBalanceAfter - platformBalanceBefore).to.equal(expectedPlatformFee);

      const job = await escrow.getJob(jobId);
      expect(job.status).to.equal(3); // Completed
      expect(job.fundsReleased).to.be.true;
    });
  });

  describe("Job Cancellation", function () {
    it("Should allow client to cancel job before acceptance", async function () {
      const deadline = (await time.latest()) + 86400;
      await escrow.connect(client).createJob("Test Job", "QmTestIPFSHash", deadline, {
        value: JOB_AMOUNT,
      });
      jobId = 1;

      const clientBalanceBefore = await ethers.provider.getBalance(client.address);

      const tx = await escrow.connect(client).cancelJob(jobId);
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;

      const clientBalanceAfter = await ethers.provider.getBalance(client.address);

      // Client should get refund minus gas
      expect(clientBalanceAfter + gasUsed - clientBalanceBefore).to.equal(JOB_AMOUNT);

      const job = await escrow.getJob(jobId);
      expect(job.status).to.equal(5); // Cancelled
    });
  });

  describe("Dispute Resolution", function () {
    beforeEach(async function () {
      const deadline = (await time.latest()) + 86400;
      await escrow.connect(client).createJob("Test Job", "QmTestIPFSHash", deadline, {
        value: JOB_AMOUNT,
      });
      jobId = 1;
      await escrow.connect(freelancer).acceptJob(jobId);
      await escrow.connect(freelancer).submitWork(jobId, "QmDeliverableHash");
    });

    it("Should allow raising a dispute", async function () {
      await expect(escrow.connect(client).raiseDispute(jobId, "Poor quality work"))
        .to.emit(escrow, "DisputeRaised")
        .withArgs(1, jobId, client.address);

      const dispute = await escrow.getDispute(1);
      expect(dispute.jobId).to.equal(jobId);
      expect(dispute.initiator).to.equal(client.address);
      expect(dispute.status).to.equal(1); // Voting
    });

    it("Should allow voting on disputes", async function () {
      await escrow.connect(client).raiseDispute(jobId, "Poor quality work");

      await escrow.connect(voter1).voteOnDispute(1, true); // Favor client
      await escrow.connect(voter2).voteOnDispute(1, false); // Favor freelancer
      await escrow.connect(voter3).voteOnDispute(1, true); // Favor client

      const dispute = await escrow.getDispute(1);
      expect(dispute.clientVotes).to.equal(2);
      expect(dispute.freelancerVotes).to.equal(1);
    });

    it("Should resolve dispute in favor of client (refund)", async function () {
      await escrow.connect(client).raiseDispute(jobId, "Poor quality work");

      await escrow.connect(voter1).voteOnDispute(1, true);
      await escrow.connect(voter2).voteOnDispute(1, true);
      await escrow.connect(voter3).voteOnDispute(1, false);

      const clientBalanceBefore = await ethers.provider.getBalance(client.address);

      await escrow.connect(owner).resolveDispute(1);

      const clientBalanceAfter = await ethers.provider.getBalance(client.address);

      expect(clientBalanceAfter - clientBalanceBefore).to.equal(JOB_AMOUNT);

      const job = await escrow.getJob(jobId);
      expect(job.status).to.equal(6); // Refunded
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to update platform fee", async function () {
      await escrow.connect(owner).updatePlatformFee(5);
      expect(await escrow.platformFeePercentage()).to.equal(5);
    });

    it("Should not allow setting fee above maximum", async function () {
      await expect(escrow.connect(owner).updatePlatformFee(15)).to.be.revertedWith("Fee too high");
    });

    it("Should allow owner to pause contract", async function () {
      await escrow.connect(owner).pause();

      const deadline = (await time.latest()) + 86400;
      await expect(
        escrow.connect(client).createJob("Test Job", "QmTestIPFSHash", deadline, {
          value: JOB_AMOUNT,
        })
      ).to.be.revertedWith("Pausable: paused");
    });
  });
});
