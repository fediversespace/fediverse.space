# Gephi

This subproject uses Gephi to layout a graph that'll then be served to people on the front-end.
Always make sure to run `./gradlew shadowJar` to compile your changes.

Note that it won't compile with the given repos:
```
> Could not resolve all files for configuration ':compile'.
   > Could not find net.java.dev:stax-utils:snapshot-20100402.
     Searched in the following locations:
       - https://repo.maven.apache.org/maven2/net/java/dev/stax-utils/snapshot-20100402/stax-utils-snapshot-20100402.pom
       - https://repo.maven.apache.org/maven2/net/java/dev/stax-utils/snapshot-20100402/stax-utils-snapshot-20100402.jar
       - https://jcenter.bintray.com/net/java/dev/stax-utils/snapshot-20100402/stax-utils-snapshot-20100402.pom
       - https://jcenter.bintray.com/net/java/dev/stax-utils/snapshot-20100402/stax-utils-snapshot-20100402.jar
       - https://dl.google.com/dl/android/maven2/net/java/dev/stax-utils/snapshot-20100402/stax-utils-snapshot-20100402.pom
       - https://dl.google.com/dl/android/maven2/net/java/dev/stax-utils/snapshot-20100402/stax-utils-snapshot-20100402.jar
       - http://bits.netbeans.org/nexus/content/groups/netbeans/net/java/dev/stax-utils/snapshot-20100402/stax-utils-snapshot-20100402.pom
       - http://bits.netbeans.org/nexus/content/groups/netbeans/net/java/dev/stax-utils/snapshot-20100402/stax-utils-snapshot-20100402.jar
     Required by:
         project : > org.gephi:gephi-toolkit:0.9.2 > org.gephi:core-library-wrapper:0.9.2
```

I just downloaded version 0.9.2 from the gephi-toolkit GitHub and manually added it to fediverse.space/gephi/lib... ¯\_(ツ)_/¯
