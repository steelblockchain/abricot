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

1. Clone the repo
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

```javascript
import { Dofus } from "abricot";

const analyzer = new Dofus.Dofus2PacketAnalyzer();
const buffer = Buffer.from([1, 2, 3, 4]); // this is just for test
const client_size = false;
analyzer.analyze(buffer, buffer.length, client_size);

const reader = new Dofus.Dofus2Reader();
reader.add(buffer, buffer.length);

// this is just for test
const test_getter = (identifier) => {
    const all_messages = [
        { 
            fields: [
                {
                    field_name: "version",

                    position: 0,
                    boolean_position: undefined, // [REQUIRED FOR SOME TYPE OF FIELD] 
                    type: "string",
                    is_array: false,
                
                    constant_length: undefined, // [REQUIRED FOR SOME TYPE OF FIELD] 
                
                    fixed_type_id: undefined, // [REQUIRED FOR SOME TYPE OF FIELD] 
                    nullable: undefined, // [REQUIRED FOR SOME TYPE OF FIELD] 
                
                    read_method: "readUTF", // [REQUIRED FOR SOME TYPE OF FIELD] 
                    read_length_method: undefined, // [REQUIRED FOR SOME TYPE OF FIELD] 
                    read_nullable_method: undefined, // [REQUIRED FOR SOME TYPE OF FIELD] 
                    read_type_id_method: undefined // [REQUIRED FOR SOME TYPE OF FIELD] 
                }
            ],
            protocol_name: "ProtocolRequired",
            protocol_id: 1234
        }
    ]

    return all_messages.find(x => {
        if(typeof identifier === "string") {
            return all_messages.find(x => x.protocol_name === identifier);
        } else if(typeof identifier === "number") {
            return all_messages.find(x => x.protocol_id === identifier)
        }
    })
}

const protocol = new Dofus.Dofus2NetworkProtocol(reader, "ProtocolRequired", "message", test_getter, test_getter);
const protocol_data = protocol.decode();
```

## Roadmap

- [x] Add Changelog
- [ ] Add Additional Templates w/ Examples
- [ ] Multi-language Support
    - [ ] Chinese

