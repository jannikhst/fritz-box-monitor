Read the data from all devices connected to your fritzBox.
Run this container in your local network and specify the following ENV variables.

ENV FRITZ_URL 'http://192.168.178.###/'
ENV FRITZ_USER '#########'
ENV FRITZ_PWD '##########'
ENV SERVER_ENDPOINT 'https://####.######.##/####'

The server enpoint should accept json post requests under the specified SERVER_ENDPOINT url
Example post body:

[
    {
        "mac": "##:##:##:##:##:##",
        "ip": "192.168.178.5"
    },
    {
        "mac": "##:##:##:##:##:##",
        "ip": "192.168.178.10"
    }
]


I personally used this to see whos currently @home.
