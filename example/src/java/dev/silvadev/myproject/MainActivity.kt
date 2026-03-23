package dev.silvadev.myproject

import androidx.appcompat.app.AppCompatActivity
import dev.silvadev.myproject.databinding.ActivityMainBinding
import android.os.Bundle

public class MainActivity : AppCompatActivity() {

	private lateinit var binding: ActivityMainBinding

    override fun onCreate(savedInstanceState: Bundle?) {
         super.onCreate(savedInstanceState)
         binding = ActivityMainBinding.inflate(layoutInflater)
         val view = binding.root
         setContentView(view)
    }
}
