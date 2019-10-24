FROM fpco/stack-build:lts-7.14 as build
RUN mkdir /opt/build
COPY . /opt/build

RUN apt-get update && \
  apt-get -y install curl gnupg && \
  curl -sL https://deb.nodesource.com/setup_11.x  | bash - && \
  apt-get -y install nodejs

RUN rm -rf /opt/build/static/build && cd /opt/build && npm install && npm run build
RUN cd /opt/build && stack build --system-ghc

FROM ubuntu:16.04
RUN mkdir -p /opt/hswtrack2
ARG BINARY_PATH
WORKDIR /opt/hswtrack2
RUN apt-get update && apt-get install -y \
  ca-certificates \
  libgmp-dev
# NOTICE THIS LINE
COPY --from=build /opt/build/.stack-work/install/x86_64-linux/lts-7.14/8.0.1/bin .
COPY --from=build /opt/build/static /opt/hswtrack2/static
COPY snaplets /opt/hswtrack2/snaplets
CMD ["/opt/hswtrack2/server", "-e", "prod"]
