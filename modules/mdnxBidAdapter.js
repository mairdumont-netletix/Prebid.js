import { registerBidder } from '../src/adapters/bidderFactory';
import { ajax } from '../src/ajax';
import { BANNER } from '../src/mediaTypes';

const ADAPTER_VERSION = 1;

const flatten = (previosValue, currentValue) => previosValue.concat(currentValue);
const getFirstBidRequestParam = (bidRequests, name) => bidRequests.find(bidRequest => bidRequest.params && bidRequest.params[name]);

const buildOpenRTBBidRequest = (bidRequests, bidderRequest) => {
  const { gdprApplies, consentString: consent } = bidderRequest.gdprConsent;
  const { referer: url, reachedTop } = bidderRequest.refererInfo;
  const bidRequest2ImpsMapper = (bidRequest) => bidRequest.mediaTypes.banner.sizes.map(([w, h]) => ({
    id: bidRequest.bidId,
    banner: {
      w,
      h,
      ext: {
        configId: bidRequest.params.configId,
        containerId: bidRequest.params.containerId,
        adUnitCode: bidRequest.adUnitCode,
      },
      topframe: reachedTop ? 1 : 0,
    },
  }));
  const openRTBBidRequest = {
    id: bidderRequest.bidderRequestId,
    imp: bidRequests.map(bidRequest2ImpsMapper).reduce(flatten, []),
    site: {
      page: url,
    },
    ext: {
      impl: ADAPTER_VERSION,
      start: bidderRequest.start,
      timeout: bidderRequest.timeout,
    },
  };
  if (gdprApplies) {
    Object.assign(openRTBBidRequest, {
      regs: { ext: { gdpr: 1 } },
      user: { ext: { consent } },
    });
  }
  if (/mdnx-bidder-test=(1|true)/i.test(url) || getFirstBidRequestParam(bidRequests, 'test')) {
    Object.assign(openRTBBidRequest, {
      test: 1,
    });
  }
  return openRTBBidRequest;
};

export const spec = {
  code: 'mdnx',
  aliases: ['nx', 'netletix'],
  supportedMediaTypes: [BANNER],

  isBidRequestValid(bid) {
    return !!(bid.params && bid.params.configId);
  },

  buildRequests(validBidRequests, bidderRequest) {
    const dev = /mdnx-bidder-dev=(1|true)/i.test(bidderRequest.refererInfo.referer) || getFirstBidRequestParam(validBidRequests, 'dev');
    const sra = /mdnx-bidder-sra=(1|true)/i.test(bidderRequest.refererInfo.referer) || getFirstBidRequestParam(validBidRequests, 'sra');
    const createServerRequest = (openRTBBidRequest) => ({
      url: 'https://bid' + (dev ? '-dev' : '') + '.md-nx.com/openrtb/v2.5/request',
      method: 'POST',
      data: openRTBBidRequest,
    });
    if (sra) {
      // if SRA enabled, build one single http request for all validBidRequests in an auction
      return createServerRequest(buildOpenRTBBidRequest(validBidRequests, bidderRequest));
    } else {
      // if NON-SRA, build individual http requests for each ad container
      return validBidRequests.map((validBidRequest) => createServerRequest(buildOpenRTBBidRequest([validBidRequest], bidderRequest)))
    }
  },

  interpretResponse(serverResponse, serverRequest) {
    const body = serverResponse && serverResponse.body;
    const openRTBBidResponse = (typeof body === 'string') ? JSON.parse(body) : body;
    const openRTBBidRequest = serverRequest.data;

    const openRTBBid2PrebidBid = (openRTBBid) => ({
      requestId: openRTBBidRequest.imp[0].id,
      ad: openRTBBid.adm,
      creativeId: openRTBBid.crid,
      cpm: openRTBBid.price,
      width: openRTBBid.w,
      height: openRTBBid.h,
      currency: openRTBBidResponse.cur || 'USD',
      netRevenue: true,
      ttl: 5,
      internalBidderData: openRTBBid,
    });

    const bids = openRTBBidResponse.seatbid
      .map(seatbid => seatbid.bid)
      .reduce(flatten, [])
      .map(openRTBBid2PrebidBid)
    ;

    return bids;
  },

  onBidWon(bid) {
    const openRTBBid = bid.internalBidderData;
    if (openRTBBid.burl) ajax(openRTBBid.burl);
    if (openRTBBid.nurl) ajax(openRTBBid.nurl);
  }
};

registerBidder(spec);
