export default {
  methods: {
    // Returns the atomic, unfilled, reserved contributions for the given wallet
    getUnfilledReservedContribution(node, addr) {
      for (const contributor of node.contributors) {
        if (contributor.address === addr && contributor.amount === 0 && contributor.reserved > 0) {
          return contributor.reserved;
        }
      }
      return 0;
    },
    getMinContribution(node, myaddr) {
      if (node.funded) {
        return 0;
      }

      const MAX_NUMBER_OF_CONTRIBUTORS = 4;
      // If we have a reserved spot then that is our minimum:
      let minContributionAtomicUnits = this.getUnfilledReservedContribution(node, myaddr);
      // Otherwise we can contribute our fair share of whatever amount is left (i.e. REMAINING/N
      // when there are N available spots).
      if (minContributionAtomicUnits === 0 && node.contributors.length < MAX_NUMBER_OF_CONTRIBUTORS) {
        const openContributionRemaining = this.openForContribution(node);

        let contributors_length = 0;
        for (const contributor of node.contributors) {
          contributors_length = contributors_length + contributor.locked_contributions.length;
        }

        minContributionAtomicUnits = openContributionRemaining /
          (MAX_NUMBER_OF_CONTRIBUTORS - contributors_length);
      }

      const minContributionOxen = minContributionAtomicUnits / 1e9;
      // ceiling to 4 decimal places
      return minContributionOxen.toFixed(4);
    },
    openForContribution(node, addr = null) {
      let openContributionRemaining =
        node.staking_requirement > node.total_reserved
          ? node.staking_requirement - node.total_reserved
          : 0;
      if (addr) {
        openContributionRemaining += this.getUnfilledReservedContribution(node, addr);
      }
      return openContributionRemaining;
    },
    openForContributionOxen(node, addr = null) {
      return (this.openForContribution(node, addr) / 1e9).toFixed(4);
    }
  }
};
