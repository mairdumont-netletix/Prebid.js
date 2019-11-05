# Overview

Module Name: MDNX Bidder Adapter
Module Type: Bidder Adapter
Maintainer: it@mairdumont-netletix.com

# Description

Module that connects to MAIRDUMONT NETLETIX (MDNX) demand sources

# Test Parameters

```javascript
var adUnits = [
  // Banner adUnit
  {
    code: 'right-div',
    mediaTypes: {
      banner: {
        sizes: [
          [300, 250],
          [300, 600],
        ],
      }
    },
    bids: [{
      bidder: 'mdnx',
      params: {
        test: 1, // get always test response
        configId: '1e810337-a60d-48cc-9b1b-b0ffc336a83c'
      }
    }]
  }
];
```
