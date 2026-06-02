FROM ubuntu:24.04

RUN apt-get update -qq \
    && DEBIAN_FRONTEND=noninteractive apt-get install -y bats \
    && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /work

COPY src/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

COPY test/entrypoint/entrypoint.bats /tests/entrypoint.bats

CMD ["bats", "/tests/entrypoint.bats"]
