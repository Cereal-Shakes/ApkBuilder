Configuration
=============

All project settings are defined in the ``project.yml`` file.

Below is a detailed explanation of each available configuration option.

---

Root Options
------------

.. code-block:: yaml

   name: my-project
   build-path: .build
   libs-path: .libs

**name**  
    The name of the project. This is used to identify the build and is typically used as the final APK file name.

**build-path**  
    Directory where all build artifacts will be generated, including intermediate files and the final APK.

**libs-path** *(optional)*  
    Directory containing external libraries.

    Only **directory-based libraries** are supported. Compressed formats such as ``.aar`` are not supported directly.

    Each library directory should contain its extracted contents (similar to an AAR), including compiled code and optional resources.

---

Binaries (Optional)
------------------

.. code-block:: yaml

   bins:
     aapt2: bin/aapt2
     javac: bin/javac
     kotlinc: bin/kotlinc
     d8: bin/d8
     apksigner: bin/apksigner

This section allows you to override the default binaries used during the build process.

Each field defines the path to a specific tool executable.

**aapt2**  
    Android Asset Packaging Tool v2. Used to compile and package Android resources.

**javac**  
    Java compiler used to compile ``.java`` files into ``.class`` files.

**kotlinc**  
    Kotlin compiler used to compile Kotlin source code.

**d8**  
    Converts Java/Kotlin bytecode (``.class``) into Dalvik bytecode (``.dex``).

**apksigner**  
    Tool used to sign the final APK.

**Note:**  
    All fields in this section are optional. If not provided, the CLI will attempt to use the binaries available in the system ``PATH``.

---

Android
-------

.. code-block:: yaml

   android:
     sdk-api-version: 34
     sdk-min-api-version: 21
     
     version-code: 1
     version-name: "1"

     sdk-path: env(ANDROID_SDK)
     manifest-path: AndroidManifest.xml
     assets-path: src/assets
     jni-path: src/jniLibs
     res-path: src/res
     java-path: src/java
     
     build-type: debug #or release 
     view-binding: true

     keystore-path: myproject.keystore
     keystore-alias: myproject
     keystore-store-pass: 87654321
     keystore-key-pass: 87654321

**sdk-api-version**  
    Target Android API level used to compile the application (targetSdk).

**sdk-min-api-version**  
    Minimum Android API level required to run the application (minSdk).

**version-code**  
    Internal version number used by Android for app updates. Must be incremented on each release.

**version-name**  
    User-visible version name of the application.

**sdk-path** *(optional)*  
    Path to the Android SDK. You can also use environment variables like ``env(ANDROID_SDK)``.

**manifest-path**  
    Path to the ``AndroidManifest.xml`` file.

**assets-path** *(optional)*  
    Path to the ``assets`` directory.

**jni-path** *(optional)*  
    Path to native libraries (``jniLibs`` directory).

**res-path**  
    Path to the Android resources directory (``res``).

**java-path**  
    Path to the Java/Kotlin source code directory.

**build-type**  
    Defines the build type:

    - ``debug``: development build, faster and not optimized  
    - ``release``: production build, optimized and signed

**view-binding**  
    Enables or disables ViewBinding generation.

**keystore-path**  
    Path to the keystore file used to sign the APK.

**keystore-alias**  
    Alias name of the key inside the keystore.

**keystore-store-pass**  
    Password for the keystore.

**keystore-key-pass**  
    Password for the specific key.