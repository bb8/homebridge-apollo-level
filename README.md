# homebridge-apollo-level

This is a plugin for [homebridge](https://github.com/nfarina/homebridge) which makes it possible to create an Apollo Ultrasonic oil tank level sensor in HomeKit exposed as a Humidity sensor.

## Why via file?

The Apollo Ultrasonic oil sensor transmits hourly broadcasts on 433MHz to communicate the oil level to its paired receiver.
We use a software defined radio (SDR) device to capture these broadcasts, together with the rtl-433 package to output the information as JSON to a file.

## SDR receiver

The transmitter's broadcast is powerful enough that most SDR receivers combined with an antenna will be able
to receive the packets. Examples:

[Nooelec NESDR Mini 2+](https://smile.amazon.co.uk/gp/product/B00VZ1AWQA/r) (~£24 in early 2022)

[RTL-SDR Blog V3](https://smile.amazon.co.uk/gp/product/B011HVUEME/r) (~£35 in early 2022)

## Installing rtl-433

### Mac
Both Macports and Homebrew provide a rtl-433 package

### Linux
Most distributions' package managers contain a rtl-433 package (e.g. apt or yum)

### Raspberry Pi
For Buster (v10), rtl-433 needs to be downloaded and compiled manually:

```
sudo apt update
sudo apt install libtool libusb-1.0.0-dev librtlsdr-dev rtl-sdr doxygen git cmake
git clone https://github.com/merbanan/rtl_433.git

cd rtl_433
mkdir build
cd build
cmake ../

make

sudo make install
```

A systemd daemon to daemonize rtl-433, in `/etc/systemd/system/rtl-433.service`:
```
[Unit]
Description=RTL 433 SDR Daemon
After=syslog.target network.target

[Service]
User=root
Group=root
Type=idle
ExecStart=/usr/local/bin/rtl_433 -M hires -M level -Y autolevel -Y squelch -F kv -F json:/home/pi/rtl-433.json
WorkingDirectory=/home/pi
TimeoutStopSec=20
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Start service automatically:
```
sudo systemctl daemon-reload
sudo systemctl enable rtl-433.service
sudo systemctl start rtl-433.service
```

Check service:
```
journalctl -u rtl-433.service
```

Thank you to [@apalrd](https://www.apalrd.net/posts/2021/rtl433/) for the build instructions.

## Example homebridge config

```json
{
  "accessory": "ApolloLevel",
  "name": "Oil Tank",
  "description": "Apollo Ultrasonic oil level monitor",
  "file_path": "/home/pi/rtl-433.json",
  "tank_height": 120
}
```

The tank height is the internal height of the oil tank in cm, and can be determined by reading the switches on the
back of your receiver and cross-referencing the switch positions with those listed in the [Apollo Ultrasonic guide](https://dunravensystems.com/wp-content/uploads/2018/09/apollo-standard-oil-level-monitor-instructions-2015.pdf).

## Install plugin
On your Homebridge computer, with the attached SDR receiver:
```
sudo npm install -g https://github.com/bb8/homebridge-apollo-level
```