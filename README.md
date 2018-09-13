# usbrelay
Node API for controlling one or multiple Sainsmart 16ch USB Relay Board(s)

## Motivation
I had been using [Sainsmart's 16ch GPIO Relay Boards](https://www.sainsmart.com/collections/internet-of-things/products/16-channel-12v-relay-module) with a [Raspberry Pi Model 3 B+](https://www.raspberrypi.org/products/raspberry-pi-3-model-b-plus/) in some automation projects I was working on. They work pretty well, but wiring is pretty annoying/messy and using multiple boards wasn't really possible as the Raspi _only_ supports up to 26 GPIO devices. 

So when I saw this [Sainsmart 16ch USB Relay Board](https://www.sainsmart.com/collections/internet-of-things/products/16-channel-9-36v-usb-relay-module), I was pretty excited to try it out. The Raspi has 4 USB ports, which meant I could potentially control up to 64 devices with one Pi. The only problem was figuring out how to actually get them to work as Sainsmart's documentation is pretty non-existent. After a few frustrating days of little progress, I was able to get one working. I originally set up [this repo](https://github.com/haf-decent/sainsmart-16-channel-usb-relay-ch341) explaining the setup process and providing a very simple interfacing script, but I have since developed this repo as a more traditional node module for you to include in your project. Hope this saves you some time and frustration.

## Getting Started
Referencing my other repo I linked above, to get these Relay Boards to work with the Raspi, you have to download a ch341 driver. The steps for downloading and installing this driver are as follows:

0. `sudo apt-get update`, `sudo apt-get upgrade`
1. Download the driver - `sudo wget https://github.com/aperepel/raspberrypi-ch340-driver/releases/download/4.4.11-v7/ch34x.ko`
2. Update your pi - `sudo rpi-update` (this might be optional, I haven't tested skipping this step)
3. Reboot your pi to implement changes - `sudo reboot`
4. Check to make sure ch341.ko is installed - `ls /lib/modules/$(uname -r)/kernel/drivers/usb/serial` ($(uname -r) should evaluate to something like "4.14.58-v7+")
5. Plug the Relay Board into your Pi
6. Check to make sure ch341 (and usbserial) process is running - `lsmod`
7. Check to make sure the Relay Board has been recognized through USB - `ls /dev/tty*` (Look for 'ttyUSB0')

If you're using multiple boards on the same Pi, I would suggest setting up udevadm rules for adding SYMLINKs to each so you can differentiate between them (the boards themselves don't typically have serial numbers and ttyUSB# links can change at any time, so it can be difficult to differentiate). We will be assigning SYMLINKs based on the physical USB port you plug the board into, so make sure you set up a consistent system for making sure each board is actually plugged into the correct port. To set up a udevadm rule for these boards, follow these steps:

0. Unplug all boards from the Pi
1. For board1, plug it into the port you want to SYMLINK to
2. Run `dmesg | grep ttyUSB` - you should see something like "usb **1-1.3**: ch341-uart converter now attached to ttyUSB0"
3. The part I highlighted in bold represents the port designation, mark this down
4. Repeat 1-3 for each relay you want to connect to the Pi
5. Once you have all the port designations, you're ready to write a udevadm rule - `sudo nano /etc/udev/rules.d/10-usb-serial.rules` (rules are assigned based on the leading number, so using '10' will make sure our rule gets applied before other usb rules)
6. For each board, add a new line (making sure you use the appropriate port designation for each KERNELS attribute and a unique name for each SYMLINK): `KERNEL=="ttyUSB*", KERNELS=="1-1.3", ATTRS{idVendor}=="1a86", ATTRS{idProduct}=="7523", SYMLINK+="usbRelay1"`
7. Save your changes and implement the rule by running `sudo udevadm trigger` or rebooting `sudo reboot`
8. To confirm, run `ls /dev/<SYMLINK name of relay here>` and you should see it has been assinged to a ttyUSB link

That's it. Your boards should now be accessible at `/dev/<SYMLINK name of relay here>` which is what we'll be using in this module.

## Installation
Ok, now that we have our Pi all set up, let's install this module:
`$ npm install -save node-usbrelay`

## Usage
This module has two constructors: `USBrelay` and `Board`

### Board
Board exposes methods for querying and altering the state of an individual relay board. So if you're only using a single board, require Board from the module and initialize it with the SYMLINK path to your board:
```javascript
const {Board} = require('node-usbrelay');

var board1 = new Board({port: '/dev/usbRelay1'});
```
A Board object has the following methods:

#### getState
The getState method returns an array representing the state of each relay with '0' representing NC (usually off) and '1' representing NO (usually on):
```javascript
const {Board} = require('node-usbrelay');

var board1 = new Board({port: '/dev/usbRelay1'});

console.log(board1.getState());

/* Example output
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
*/
```

#### setState
The setState method accepts a state array, which must contain 16 entries of either '0' or '1', and uses the toggle method to change the state of each relay as described by the array. It also accepts a callback to report any errors and return an array of successful state changes:
```javascript
const {Board} = require('node-usbrelay');

var board1 = new Board({port: '/dev/usbRelay1'});

board1.setState([0,1,1,0,1,0,0,0,0,1,1,0,1,0,0,1], (errors, success) => {
  if (errors) return console.log(errors);
  console.log(board1.getState());
});

/* Example output
[0,1,1,0,1,0,0,0,0,1,1,0,1,0,0,1]
*/
```

#### toggle & toggleOne
The toggle method accepts an array of relay numbers (1-16) and a command ("on" or "off"), as well as a callback to report any errors and return an array of relays that were successfully toggled. The toggleOne method is just a lighter version for toggling a single relay at a time:
```javascript
const {Board} = require('node-usbrelay');

var board1 = new Board({port: '/dev/usbRelay1'});

board1.toggle([2,3,5,10,11,13,16], "on", (errors, success) => {
  if (errors) return console.log(errors);
  console.log(board1.getState());
  board1.toggleOne(8, "on", (err) => {
    if (err) return console.log(err);
    console.log(board1.getState());
  });
});

/* Example output
[0,1,1,0,1,0,0,0,0,1,1,0,1,0,0,1]
[0,1,1,0,1,0,0,1,0,1,1,0,1,0,0,1]
*/
```

#### reset
The reset method turns all relays "off". It is similar to using setState with a 16x'0' array, but much quicker:
```javascript
const {Board} = require('node-usbrelay');

var board1 = new Board({port: '/dev/usbRelay1'});

board1.toggle([2,3,5,10,11,13,16], "on", (errors, success) => {
  if (errors) return console.log(errors);
  console.log(board1.getState());
  board1.reset((err) => {
    if (err) return console.log(err);
    console.log(board1.getState());
  });
});

/* Example output
[0,1,1,0,1,0,0,0,0,1,1,0,1,0,0,1]
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
*/
```

### USBrelay
If you have multiple boards connected to your Pi, I suggest using the USBrelay constructor, which allows you to manage all boards at once (and also features a discovery method):
```javascript
const {USBrelay} = require('node-usbrelay');

var relayGroup = new USBrelay();
```
If you already know the ports you want to initialize, you can pass a `ports` array to the constructor:
```javascript
const {USBrelay} = require('node-usbrelay');

var ports = ['/dev/usbRelay1','/dev/usbRelay2','/dev/usbRelay3'];
var relayGroup = new USBrelay({ports: ports});
```

A USBrelay object shares a lot of the same methods as Board, with some additional capabilities:

#### listPorts & findBoards
The listPorts and findBoards methods both utilize the serialport library's list method to find available ports/boards. The listPorts method will list all available ports, whereas the findBoards method will filter the list to just find connected Sainsmart 16ch Relay Boards:
```javascript
const {USBrelay} = require('node-usbrelay');

var relayGroup = new USBrelay();

relayGroup.findBoards((err, found) => {
  if (err) return console.log(err);
  console.log(JSON.stringify(found, null, 4));
});
```

#### assignBoards
The assignBoards method accepts an array of port designations, initializing a new Board object for each. It will throw an error if the board initialization fails for any reason. Otherwise it returns the number of boards that were successfully initialized (note: this method is not necessary if you initialize the USBrelay constructor with a ports array):
```javascript
const {USBrelay} = require('node-usbrelay');

var relayGroup = new USBrelay();

var ports = ['/dev/usbRelay1','/dev/usbRelay2','/dev/usbRelay3'];
console.log(relayGroup.assignBoards(ports));

/* Example output
3
*/
```

#### getStates
The getStates method returns an array of the state of each initialized Board (note: the array is filled in the order in which the Boards were initialized - meaning the first array corresponds to the state of '/dev/usbRelay1' and so on):
```javascript
const {USBrelay} = require('node-usbrelay');

var ports = ['/dev/usbRelay1','/dev/usbRelay2','/dev/usbRelay3'];
var relayGroup = new USBrelay({ports: ports});

console.log(relayGroup.getStates());

/* Example output
[
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
]
*/
```

#### setStates
The setStates method can be used to specify desired states for each Board. There are two ways to construct your input stateArray:

1. Single Array

stateArray has a length of the number of initialized Boards multiplied by 16. Relays are designated according to the order in which their Board was intialized, so '/dev/usbRelay1' has relays 1-16, '/dev/usbRelay2' has 17-32, and '/dev/usbRelay3' has 33-48. stateArray index position + 1 = Relay# (wasn't quite sure how else to say that clearly)

2. Array of Arrays

Each array inside the main array represent the board at that index, so the first array represents the state of '/dev/usbRelay1' for example. You must include as many arrays (even if they are emtpy) as there are boards initialized or an error will be thrown

```javascript
const {USBrelay} = require('node-usbrelay');

var ports = ['/dev/usbRelay1','/dev/usbRelay2','/dev/usbRelay3'];
var relayGroup = new USBrelay({ports: ports});

// turn on the first (local 1) and last (local 16) relay of each board
// using single Array
var singleArray = Array.from(
  {length: 16*relayGroup.nBoards}, 
  (el, i) => (i%16 == 0 || i%16 == 15) ? 1: 0
);
relayGroup.setStates(singleArray, "on", (errors, success) => {
  if (errors) return console.log(errors);
  console.log(relayGroup.getStates());
});

// using Array of Arrays
var arrOfArr = relayGroup.boards.map(b => Array.from(
  {length: 16}, 
  (el, i) => (i == 0 || i == 15) ? 1: 0
));
relayGroup.setStates(arrOfArr, "on", (errors, success) => {
  if (errors) return console.log(errors);
  console.log(relayGroup.getStates());
})

/* Example output for both
[
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1]
]
*/
```

#### toggle & toggleOne
The toggle and toggleOne methods are similar to the Board methods of the same name. The difference is that these methods can access each initialized Board in one command. Similarly to setStates, there are two ways to specify which relays on which Boards you want to toggle:

1. Single Array

Relays are accessible according to the order in which their Board was intialized, so '/dev/usbRelay1' has relays 1-16, '/dev/usbRelay2' has 17-32, and '/dev/usbRelay3' has 33-48. (note: the toggleOne method uses this numbering system exclusively)

2. Array of Arrays

Each array inside the main array represent the board at that index, so the first array will toggle relays on '/dev/usbRelay1' for example. You must include as many arrays (even if they are emtpy) as there are boards initialized or an error will be thrown

```javascript
const {USBrelay} = require('node-usbrelay');

var ports = ['/dev/usbRelay1','/dev/usbRelay2','/dev/usbRelay3'];
var relayGroup = new USBrelay({ports: ports});

// turn on the first (local 1) and last (local 16) relay of each board
// using single Array
relayGroup.toggle([1,16,17,32,33,48], "on", (errors, success) => {
  if (errors) return console.log(errors);
  console.log(relayGroup.getStates());
});

// using Array of Arrays
relayGroup.toggle([[1,16],[1,16],[1,16]], "on", (errors, success) => {
  if (errors) return console.log(errors);
  console.log(relayGroup.getStates());
})

/* Example output for both
[
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1]
]
*/
```

#### resetAll
The resetAll method resets all connected Boards to a 16x'0' state:
```javascript
const {USBrelay} = require('node-usbrelay');

var ports = ['/dev/usbRelay1','/dev/usbRelay2','/dev/usbRelay3'];
var relayGroup = new USBrelay({ports: ports});

// turn on the first (local 1) and last (local 16) relay of each board and then reset them
relayGroup.toggle([1,16,17,32,33,48], "on", (errors, success) => {
  if (errors) return console.log(errors);
  console.log(relayGroup.getStates());
  relayGroup.resetAll((errors, success) => {
    if (errors) return console.log(errors);
    console.log(relayGroup.getStates());
  });
});

/* Example output
[
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1]
]
]
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
]
*/
```

#### USBrelay.boards
In addition to the top-level USBrelay methods listed out above, the USBrelay object exposes the Board methods of each initialized Board, so each Board is still able to be controlled individually. You can access individual boards through the boards array:
```javascript
const {USBrelay} = require('node-usbrelay');

var ports = ['/dev/usbRelay1','/dev/usbRelay2','/dev/usbRelay3'];
var relayGroup = new USBrelay({ports: ports});

relayGroup.toggle([1,16,17,32,33,48], "on", (errors, success) => {
  if (errors) return console.log(errors);
  console.log(relayGroup.getStates());
  relayGroup.boards[1].reset((err) => {
    if (err) return console.log(err);
    console.log(relayGroup.getStates());
  });
});

/* Example output
[
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1]
]
]
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1]
]
*/
```

## Updates
1. Get state of Board directly through a command rather than assuming 16x'0' state when initializing Boards

## Contributing
I made this module on my own. Any help/feedback is appreciated.
