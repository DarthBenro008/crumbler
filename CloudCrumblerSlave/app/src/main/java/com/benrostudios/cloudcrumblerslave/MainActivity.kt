package com.benrostudios.cloudcrumblerslave

import android.annotation.SuppressLint
import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle
import android.util.Log
import android.util.Log.d
import android.widget.Button
import android.widget.EditText
import android.widget.TextView
import android.widget.Toast
import com.google.android.material.textfield.TextInputEditText
import com.google.gson.Gson
import io.socket.client.IO
import io.socket.client.Socket
import org.json.JSONObject
import java.util.*

class MainActivity : AppCompatActivity() {
    lateinit var socket: Socket
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        findViewById<Button>(R.id.button).setOnClickListener {
            val text = findViewById<EditText>(R.id.input_address).text.toString()
            if (text.startsWith("http://")) {
                connectToSocket(text)
            } else {
                Toast.makeText(this, "Please enter an valid URL!", Toast.LENGTH_LONG).show()
            }

        }
    }


    private fun connectToSocket(nodeAddress: String) {
        try {
            socket = IO.socket("$nodeAddress:3000/")
            socket.let {
                it.connect()
                    .on(Socket.EVENT_CONNECT) {
                        Log.d("SignallingClient", "Socket connected!!!!!")
                        runOnUiThread {
                            setStatusText("connected")
                        }
                    }
                    .on(Socket.EVENT_CONNECT_ERROR) { err ->
                        Log.d("SignallingClient", err.contentDeepToString())
                        runOnUiThread {
                            setStatusText("connection failure")
                        }
                    }
                    .on("nearbyUser") { data ->
                        Log.d("SignallingClient", data.contentToString())
                    }
                    .on("doWork") { data ->
                        runOnUiThread {
                            setStatusText("work in progress!")
                        }
                        Log.d("SignallingClient", data.contentToString())
                        val json = JSONObject(data[0].toString())
                        val range = json["range"] as Int
                        val filter = json["filter"] as Int
                        Log.d("SignallingClient", "$range $filter")
                        calculateSieve(range, filter)
                    }
            }
            if (socket.connected()) {
                Toast.makeText(this, "Socket is connected", Toast.LENGTH_SHORT).show()
            } else {
                Toast.makeText(this, "Connection in progress", Toast.LENGTH_SHORT).show()
            }
        } catch (e: Exception) {
            throw RuntimeException(e)
        }
    }

    private fun calculateSieve(range: Int, filter: Int) {
        val numeracy = MutableList(range) { it + 1 }
        val res = numeracy.filter { it % filter == 0 }
        Log.d("SignallingClient", "$res")
        val json = Gson().toJson(res)
        socket.emit("incoming_result", json)
    }


    @SuppressLint("SetTextI18n")
    private fun setStatusText(status: String) {
        findViewById<TextView>(R.id.textView).text = "Status: $status"
    }

}