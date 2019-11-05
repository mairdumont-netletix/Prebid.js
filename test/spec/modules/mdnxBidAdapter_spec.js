import { spec } from 'modules/mdnxBidAdapter';
import { newBidder } from 'src/adapters/bidderFactory';

const bidRequest = {
  bidder: 'mdnx',
  adUnitCode: 'test-div',
  sizes: [[300, 250], [300, 600]],
  params: {
    configId: '1e810337-a60d-48cc-9b1b-b0ffc336a83c'
  },
};

describe.only('mdnxBidAdapter', function () {
  const adapter = newBidder(spec);

  describe('inherited functions', function () {
    it('exists and is a function', function () {
      expect(adapter.callBids).to.exist.and.to.be.a('function');
    });
  });

  describe('isBidRequestValid', function () {
    it('should return false', function () {
      let bid = Object.assign({}, bidRequest);
      bid.params = {};
      expect(spec.isBidRequestValid(bid)).to.equal(false);
    });

    it('should return true', function () {
      expect(spec.isBidRequestValid(bidRequest)).to.equal(true);
    });
  });
});
