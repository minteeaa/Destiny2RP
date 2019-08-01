# Destiny 2 Rich Presence
A (surprisingly) working and simple Discord RPC client to show off what you're doing in Destiny 2.

# Compatibility
This has been coded and used on Windows, and currently only supports Windows. It also has only been tested on the Battle.net platform, but there will be other platforms in the future.

# Installation
You'll need a few things:
* Destiny 2
* [NodeJS](https://nodejs.org/en/)
* [Python](https://www.python.org/)
* [Windows Build Tools 2015](https://www.microsoft.com/en-us/download/details.aspx?id=48159)

## The program
Now that you've gotten those, it's time to install the thing
* Clone the repo to a place on your computer.
* Run the `Update Deps` Batch file to install and update dependencies.
* Once that's done, create a (or use the included) .env file to input a [Bungie API Key](https://www.bungie.net/en/User/API)
* Run the `Start App` Batch file and input your username and tag (eg. zetari#11749)
* Inputting `y` to verbose will log a lot more to the console window. Typing `n` is recommended.

## Getting your Bungie API Key
* Head over to [the Bungie API site](https://www.bungie.net/en/User/API) and sign in.
* Create a new application, and name it whatever you want.
* Make the application `confidential` and create the application.
* Scroll down and copy the API Key, put that into the .env file.
