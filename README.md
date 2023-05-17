## Abricot

Yes

## Getting Started

This is an example of how you may give instructions on setting up your project locally.
To get a local copy up and running follow these simple example steps.

### Prerequisites

* npm
  ```sh
  npm install npm@latest -g
  ```

### Installation

1. Install the repo
   ```sh
   npm install abricot
   ```

## Usage

# App

```javascript
import { App } from "abricot";

class TestApp extends App.BaseApp {}

class TestModule extends App.BaseModule { }

class Test2Module extends TestModule { }
```

# Dofus

This project use [Botofu procotol json format](https://gitlab.com/botofu/botofu/-/tree/dev/src/botofu/protocol/parser)


```javascript
import { Dofus } from "abricot";

const analyzer = new Dofus.Dofus2PacketAnalyzer();
const buffer = Buffer.from([1, 2, 3, 4, 5, 6]); // this is just for test
const client_size = false;
const packets = analyzer.analyze(buffer, buffer.length, client_size);

const test_packet = packets.shift();

const reader = new Dofus.Dofus2Reader();
reader.add(test_packet.data, test_packet.length);

// this is just for test
const all_messages = []; // you'll need to define how you get all your messages
const test_message_getter = (identifier) => {
    return all_messages.find(x => {
        if(typeof identifier === "string") {
            return all_types.find(x => x.name === identifier);
        } else if(typeof identifier === "number") {
            return all_types.find(x => x.protocolID === identifier)
        }
    })
}

const all_types = []; // you'll need to define how you get all your types
const test_type_getter = (identifier) => {
    return all_types.find(x => {
        if(typeof identifier === "string") {
            return all_types.find(x => x.name === identifier);
        } else if(typeof identifier === "number") {
            return all_types.find(x => x.protocolID === identifier)
        }
    })
}

const protocol = new Dofus.Dofus2NetworkProtocol(
    reader, 
    "ProtocolRequired", 
    "message", 
    test_message_getter, 
    test_type_getter
);
const protocol_data = protocol.decode();
```

## Roadmap

- [x] Add Changelog
- [ ] Add Additional Templates w/ Examples
- [ ] Multi-language Support
    - [ ] Chinese

