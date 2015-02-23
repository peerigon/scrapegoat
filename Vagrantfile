# -*- mode: ruby -*-
# vi: set ft=ruby :

$script = <<SCRIPT

sudo apt-get update

sudo apt-get -y install python-software-properties python g++ make

sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 7F0CEB10

echo 'deb http://downloads-distro.mongodb.org/repo/ubuntu-upstart dist 10gen' | sudo tee /etc/apt/sources.list.d/mongodb.list

sudo add-apt-repository -y ppa:chris-lea/node.js
sudo add-apt-repository -y ppa:git-core/ppa


sudo apt-get update

# vim
sudo apt-get -y install vim

# update git
sudo apt-get -y install git

# node
sudo apt-get -y install nodejs

# mongodb
sudo apt-get -y install mongodb-org

# npm modules
sudo npm install -g npm # update npm
sudo npm install -g grunt-cli
sudo npm install -g mocha

SCRIPT

# Vagrantfile API/syntax version. Don't touch unless you know what you're doing!
VAGRANTFILE_API_VERSION = "2"

Vagrant.configure(VAGRANTFILE_API_VERSION) do |config|

    config.vm.box = "precise64"

    config.vm.box_url = "http://files.vagrantup.com/precise64.box"

    config.vm.provision "shell", inline: $script

    config.vm.network "private_network", ip: "192.168.50.100"

    config.ssh.shell = "bash -c 'BASH_ENV=/etc/profile exec bash'" # avoids 'stdin: is not a tty' error.
    config.ssh.forward_agent = true

     config.vm.provider "virtualbox" do |v|
        v.memory = 1024
        v.cpus = 2
      end
end